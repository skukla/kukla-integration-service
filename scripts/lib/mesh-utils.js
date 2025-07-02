/**
 * Shared mesh utilities for deployment scripts
 * Provides consistent mesh update functionality with optimized timing
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const ora = require('ora');

const execAsync = promisify(exec);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a spinner with consistent styling
 * @param {string} text - Spinner text
 * @returns {Object} Ora spinner instance
 */
function createSpinner(text) {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots',
  });
}

/**
 * Format spinner success message with consistent styling
 * @param {string} message - Success message
 * @returns {string} Formatted message
 */
function formatSpinnerSuccess(message) {
  return chalk.green(message);
}

/**
 * Update API Mesh with configurable retry logic
 * @param {Object} options - Configuration options
 * @param {boolean} options.isProd - Whether this is production environment
 * @param {number} options.waitTimeSeconds - Seconds to wait between status checks (default: 90)
 * @param {number} options.maxStatusChecks - Maximum number of status checks (default: 2 for staging, 4 for prod)
 * @param {boolean} options.showDetailedOutput - Show detailed status output (default: true)
 * @returns {Promise<boolean>} Success/failure status
 */
async function updateMeshWithRetry({
  isProd = false,
  waitTimeSeconds = 90,
  maxStatusChecks = null, // Will default based on environment
  showDetailedOutput = true,
} = {}) {
  const environment = isProd ? 'production' : 'staging';
  const defaultMaxChecks = isProd ? 4 : 2; // 6 min for prod, 3 min for staging
  const actualMaxChecks = maxStatusChecks || defaultMaxChecks;

  try {
    console.log(chalk.cyan(`\n🔄 Updating API Mesh for ${environment}...\n`));

    // Send mesh update command
    const updateCommand = `aio api-mesh:update mesh.json${isProd ? ' --ignoreCache' : ''} --autoConfirmAction`;

    // Use spawn for production interactive mode, execAsync for staging
    if (isProd) {
      console.log(chalk.blue(`▶️ Running interactive command: ${updateCommand}`));
      console.log(chalk.yellow('Please follow the prompts from the command below.\n'));

      await new Promise((resolve, reject) => {
        const [cmd, ...args] = updateCommand.split(' ');
        const child = spawn(cmd, args, {
          stdio: 'inherit',
          shell: true,
        });

        child.on('close', (code) => {
          if (code !== 0) {
            console.log(chalk.red(`\n❌ Command failed with exit code ${code}`));
            reject(new Error('Update command failed'));
          } else {
            console.log(chalk.green('\n✅ Update command completed'));
            resolve();
          }
        });

        child.on('error', (err) => {
          console.log(chalk.red(`\n❌ Failed to start command: ${updateCommand}`));
          reject(err);
        });
      });
    } else {
      const updateSpinner = createSpinner('Sending mesh update command...');
      await execAsync(updateCommand);
      updateSpinner.succeed(formatSpinnerSuccess('Mesh update command sent'));
    }

    console.log(chalk.blue('\nMesh is provisioning...\n'));

    // Poll status for up to maxStatusChecks attempts
    let statusAttempt = 1;

    while (statusAttempt <= actualMaxChecks) {
      // Wait before checking status
      console.log(
        chalk.blue(
          `⏳ Waiting ${waitTimeSeconds} seconds before status check ${statusAttempt}/${actualMaxChecks}...`
        )
      );
      await sleep(waitTimeSeconds * 1000);
      console.log(chalk.green('✅ Wait complete\n'));

      // Check mesh status
      const statusSpinner = createSpinner(
        `Checking mesh status (${statusAttempt}/${actualMaxChecks})...`
      );
      const result = await execAsync('aio api-mesh:status');
      const statusOutput = result.stdout;
      statusSpinner.succeed(formatSpinnerSuccess('Mesh status checked'));

      const lowerStatus = statusOutput.toLowerCase();

      if (showDetailedOutput) {
        console.log(chalk.cyan('\n------------------- MESH STATUS -------------------'));
        console.log(chalk.white(statusOutput.trim()));
        console.log(chalk.cyan('-------------------------------------------------\n'));
      }

      if (lowerStatus.includes('success')) {
        console.log(chalk.bold.green('✅ API Mesh update successful!\n'));
        return true;
      } else if (lowerStatus.includes('error') || lowerStatus.includes('failed')) {
        console.log(
          chalk.bold.red(
            `❌ API Mesh update failed with error. Please check manually or run: npm run deploy:mesh${isProd ? ':prod' : ''}\n`
          )
        );
        return false;
      } else if (statusAttempt < actualMaxChecks) {
        console.log(chalk.yellow(`⏳ Mesh still updating... (${lowerStatus.trim()})\n`));
        statusAttempt++;
      } else {
        console.log(
          chalk.bold.red(
            `❌ API Mesh update timed out after ${actualMaxChecks} checks (${actualMaxChecks * waitTimeSeconds}s). Please check manually or run: npm run deploy:mesh${isProd ? ':prod' : ''}\n`
          )
        );
        return false;
      }
    }

    return false;
  } catch (error) {
    console.log(chalk.bold.red(`❌ Mesh update failed: ${error.message}\n`));
    return false;
  }
}

/**
 * Simple command runner with spinner support
 * @param {string} command - Command to run
 * @param {Object} options - Options
 * @param {boolean} options.isInteractive - Run in interactive mode
 * @param {string} options.spinnerText - Text for spinner
 * @param {string} options.successText - Success message
 * @returns {Promise<string>} Command output
 */
async function runCommand(command, { isInteractive = false, spinnerText, successText } = {}) {
  const spinner = ora(spinnerText).start();

  return new Promise((resolve, reject) => {
    if (isInteractive) {
      spinner.stop();
      console.log(chalk.blue(`\n▶️ Running interactive command: ${command}`));
      console.log(chalk.yellow('Please follow the prompts from the command below.\n'));
    }

    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: isInteractive ? 'inherit' : 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    if (!isInteractive) {
      child.stdout.on('data', (data) => (stdout += data.toString()));
      child.stderr.on('data', (data) => (stderr += data.toString()));
    }

    child.on('close', (code) => {
      if (code !== 0) {
        spinner.fail(chalk.red(`Error: Command failed with exit code ${code}`));
        if (!isInteractive) console.error(chalk.red(stderr));
        reject(new Error(stderr));
      } else {
        spinner.succeed(chalk.green(successText || spinnerText));
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      spinner.fail(chalk.red(`Failed to start command: ${command}`));
      console.error(err);
      reject(err);
    });
  });
}

module.exports = {
  updateMeshWithRetry,
  runCommand,
  createSpinner,
  formatSpinnerSuccess,
  sleep,
};
