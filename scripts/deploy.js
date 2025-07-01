/**
 * Enhanced deployment script with automatic mesh update handling
 * Automatically detects when mesh resolvers change and updates API Mesh
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const ora = require('ora');

const { detectEnvironment } = require('../src/core/environment');

const execAsync = promisify(exec);

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a spinner for a specific step
 */
function createSpinner(text) {
  return ora({
    text,
    spinner: 'dots',
    color: 'blue',
  }).start();
}

/**
 * Format spinner success message
 */
function formatSpinnerSuccess(message) {
  return chalk.green(message);
}

/**
 * Update API Mesh with configurable retry logic
 * @param {Object} options - Configuration options
 * @param {boolean} options.isProd - Whether this is production environment
 * @param {number} options.waitTimeSeconds - Seconds to wait between status checks (default: 90)
 * @param {number} options.maxStatusChecks - Maximum number of status checks (default: 2)
 * @returns {Promise<boolean>} Success/failure status
 */
async function updateMeshWithRetry({
  isProd = false,
  waitTimeSeconds = 90,
  maxStatusChecks = 2,
} = {}) {
  const environment = isProd ? 'production' : 'staging';

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

    while (statusAttempt <= maxStatusChecks) {
      // Wait before checking status
      console.log(
        chalk.blue(
          `⏳ Waiting ${waitTimeSeconds} seconds before status check ${statusAttempt}/${maxStatusChecks}...`
        )
      );
      await sleep(waitTimeSeconds * 1000);
      console.log(chalk.green('✅ Wait complete\n'));

      // Check mesh status
      const statusSpinner = createSpinner(
        `Checking mesh status (${statusAttempt}/${maxStatusChecks})...`
      );
      const result = await execAsync('aio api-mesh:status');
      const statusOutput = result.stdout;
      statusSpinner.succeed(formatSpinnerSuccess('Mesh status checked'));

      const lowerStatus = statusOutput.toLowerCase();

      console.log(chalk.cyan('\n------------------- MESH STATUS -------------------'));
      console.log(chalk.white(statusOutput.trim()));
      console.log(chalk.cyan('-------------------------------------------------\n'));

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
      } else if (statusAttempt < maxStatusChecks) {
        console.log(chalk.yellow(`⏳ Mesh still updating... (${lowerStatus.trim()})\n`));
        statusAttempt++;
      } else {
        console.log(
          chalk.bold.red(
            `❌ API Mesh update timed out after ${maxStatusChecks} checks. Please check manually or run: npm run deploy:mesh${isProd ? ':prod' : ''}\n`
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
 * Check if mesh resolver was regenerated during build
 */
async function checkMeshResolverRegeneration() {
  try {
    const { stdout } = await execAsync('node scripts/generate-mesh-resolver.js --verbose');

    // Check if resolver was actually regenerated
    if (stdout.includes('🔄 Generating mesh resolver...')) {
      return { regenerated: true, reason: 'Changes detected in template or configuration' };
    } else if (stdout.includes('✅ Mesh resolver is up to date')) {
      return { regenerated: false, reason: 'No changes detected' };
    } else {
      return { regenerated: false, reason: 'Unknown status' };
    }
  } catch (error) {
    throw new Error(`Failed to check mesh resolver status: ${error.message}`);
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  const isProd = process.argv.includes('--workspace=Production');
  const environment = isProd ? 'production' : 'staging';

  console.log(chalk.bold.cyan(`\n🚀 Starting deployment to ${environment}...\n`));

  try {
    // Step 1: Environment Detection
    const envSpinner = createSpinner('Detecting environment...');
    await sleep(800); // Longer delay for first step
    const env = detectEnvironment({}, { allowCliDetection: true });
    envSpinner.succeed(formatSpinnerSuccess(`Environment detected: ${env}`));
    await sleep(300); // Small delay between steps

    // Step 2: Clean build
    const cleanSpinner = createSpinner('Cleaning build artifacts...');
    await execAsync('npm run clean');
    cleanSpinner.succeed(formatSpinnerSuccess('Build artifacts cleaned'));
    await sleep(300);

    // Step 3: Run build process
    const buildSpinner = createSpinner('Running build process...');
    await execAsync('node scripts/build.js');
    buildSpinner.succeed(formatSpinnerSuccess('Build process completed'));
    await sleep(300);

    // Step 4: Check if mesh resolver was regenerated
    const meshCheckSpinner = createSpinner('Checking mesh resolver status...');
    const meshStatus = await checkMeshResolverRegeneration();
    meshCheckSpinner.succeed(formatSpinnerSuccess(`Mesh resolver: ${meshStatus.reason}`));
    await sleep(500); // Longer delay before deployment

    // Step 5: Deploy App Builder actions
    console.log(chalk.blue('\n🔧 Deploying App Builder actions...\n'));
    const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';

    // Use spawn to show real-time output during deployment
    const [cmd, ...args] = deployCommand.split(' ');

    await new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: 'inherit', shell: true });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.red('\n❌ App Builder deployment failed'));
          reject(new Error(`Deployment failed with exit code ${code}`));
        } else {
          console.log(chalk.green('\n✅ App Builder actions deployed'));
          resolve();
        }
      });

      child.on('error', (err) => {
        console.log(chalk.red('\n❌ Failed to start deployment'));
        reject(err);
      });
    });

    // Step 6: Update mesh if resolver was regenerated
    if (meshStatus.regenerated) {
      console.log(
        chalk.yellow('\n🔄 Mesh resolver was regenerated. Updating API Mesh automatically...')
      );

      const meshUpdateSuccess = await updateMeshWithRetry({
        isProd,
        waitTimeSeconds: 90,
        maxStatusChecks: 2,
      });

      if (!meshUpdateSuccess) {
        console.log(chalk.red('\n⚠️  Mesh update failed. You may need to run manually:'));
        console.log(chalk.cyan(`   npm run deploy:mesh${isProd ? ':prod' : ''}\n`));
        process.exit(1);
      }
    } else {
      console.log(chalk.green('\n✅ Mesh resolver unchanged. No mesh update needed.\n'));
    }

    console.log(chalk.bold.green(`🎉 Deployment to ${environment} completed successfully!\n`));
  } catch (error) {
    console.error(chalk.red('\n❌ Deployment failed:'), error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { deploy, updateMeshWithRetry };

// Run deployment if called directly
if (require.main === module) {
  deploy();
}
