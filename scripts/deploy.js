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
 * Sleep helper for smoother animations
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
 * Run a command with proper error handling
 */
function runCommand(command, { isInteractive = false, spinnerText, successText }) {
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
 * Update API Mesh with retry logic
 */
async function updateMeshWithRetry(isProd, maxRetries = 3) {
  const environment = isProd ? 'production' : 'staging';
  const waitTimeInSeconds = 90;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        chalk.cyan(`\n🔄 API Mesh update attempt ${attempt}/${maxRetries} for ${environment}...\n`)
      );

      // Update the mesh
      const updateCommand = `aio api-mesh:update mesh.json${isProd ? ' --ignoreCache' : ''} --autoConfirmAction`;
      await runCommand(updateCommand, {
        isInteractive: isProd,
        spinnerText: `Updating API Mesh in ${environment}...`,
        successText: `Sent update command to API Mesh in ${environment}`,
      });

      console.log(chalk.blue('\nUpdate command sent. Mesh is provisioning...'));

      // Wait for mesh to provision
      const waitSpinner = ora(
        `Waiting ${waitTimeInSeconds} seconds for mesh provisioning...`
      ).start();
      await new Promise((resolve) => setTimeout(resolve, waitTimeInSeconds * 1000));
      waitSpinner.succeed(chalk.green('Wait complete.'));

      // Check mesh status
      const statusOutput = await runCommand('aio api-mesh:status', {
        spinnerText: 'Checking mesh status...',
        successText: 'Checked mesh status',
      });

      console.log(chalk.cyan('\n------------------- MESH STATUS -------------------\n'));
      console.log(chalk.white(statusOutput.trim()));
      console.log(chalk.cyan('\n-------------------------------------------------\n'));

      if (statusOutput.includes('success')) {
        console.log(chalk.bold.green('✅ API Mesh update successful!\n'));
        return true;
      } else if (attempt < maxRetries) {
        console.log(
          chalk.bold.yellow(
            `⚠️  API Mesh status is not "success". Retrying... (${attempt}/${maxRetries})\n`
          )
        );
        await sleep(10000); // Wait 10 seconds before retry
      } else {
        console.log(
          chalk.bold.red(
            `❌ API Mesh update failed after ${maxRetries} attempts. Please check manually.\n`
          )
        );
        return false;
      }
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(
          chalk.bold.yellow(
            `⚠️  Mesh update attempt ${attempt} failed: ${error.message}. Retrying...\n`
          )
        );
        await sleep(10000); // Wait 10 seconds before retry
      } else {
        console.log(
          chalk.bold.red(`❌ Mesh update failed after ${maxRetries} attempts: ${error.message}\n`)
        );
        return false;
      }
    }
  }

  return false;
}

/**
 * Parse and display deployment URLs from aio app deploy output
 */
function displayDeploymentUrls(deployOutput, environment) {
  if (!deployOutput) {
    console.log(chalk.yellow('\n⚠️  No deployment output to parse for URLs\n'));
    return;
  }

  console.log(chalk.bold.cyan(`\n🌐 Deployment URLs for ${environment}:\n`));

  // Parse different URL patterns from aio app deploy output
  const lines = deployOutput.split('\n');
  const urls = [];

  lines.forEach((line) => {
    // Match various URL patterns that aio app deploy outputs
    const urlPatterns = [
      /https:\/\/[^\s]+\.adobeioruntime\.net[^\s]*/g,
      /https:\/\/[^\s]+\.adobeio-static\.net[^\s]*/g,
      /https:\/\/[^\s]+\.adobe\.com[^\s]*/g,
      /Web app URL:\s+(https:\/\/[^\s]+)/i,
      /Action URL:\s+(https:\/\/[^\s]+)/i,
      /Runtime URL:\s+(https:\/\/[^\s]+)/i,
    ];

    urlPatterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((url) => {
          // Clean up the URL (remove trailing punctuation)
          const cleanUrl = url.replace(/[.,;:!?]+$/, '');
          if (!urls.includes(cleanUrl)) {
            urls.push(cleanUrl);
          }
        });
      }
    });
  });

  if (urls.length > 0) {
    urls.forEach((url) => {
      const icon = url.includes('adobeio-static.net') ? '🌐' : '⚡';
      const type = url.includes('adobeio-static.net') ? 'Web App' : 'Runtime';
      console.log(`  ${icon} ${chalk.bold(type)}: ${chalk.blue.underline(url)}`);
    });
  } else {
    console.log(chalk.yellow('  ⚠️  No URLs found in deployment output'));
    console.log(chalk.gray('  Raw output (last 10 lines):'));
    const lastLines = lines.slice(-10).filter((line) => line.trim());
    lastLines.forEach((line) => {
      console.log(chalk.gray(`    ${line}`));
    });
  }

  console.log(''); // Add spacing
}

/**
 * Main deployment function
 */
async function deploy() {
  const isProd = process.argv.includes('--workspace=Production');
  const environment = isProd ? 'production' : 'staging';

  console.log(chalk.bold.cyan(`\n🚀 Starting enhanced deployment to ${environment}...\n`));

  try {
    // Step 1: Environment Detection
    const envSpinner = createSpinner('Detecting environment...');
    await sleep(500);
    const env = detectEnvironment({}, { allowCliDetection: true });
    envSpinner.succeed(formatSpinnerSuccess(`Environment detected: ${env}`));

    // Step 2: Clean build
    const cleanSpinner = createSpinner('Cleaning build artifacts...');
    await execAsync('npm run clean');
    cleanSpinner.succeed(formatSpinnerSuccess('Build artifacts cleaned'));

    // Step 3: Run build process
    const buildSpinner = createSpinner('Running build process...');
    await execAsync('node scripts/build.js');
    buildSpinner.succeed(formatSpinnerSuccess('Build process completed'));

    // Step 4: Check if mesh resolver was regenerated
    const meshCheckSpinner = createSpinner('Checking mesh resolver status...');
    const meshStatus = await checkMeshResolverRegeneration();
    meshCheckSpinner.succeed(formatSpinnerSuccess(`Mesh resolver: ${meshStatus.reason}`));

    // Step 5: Deploy App Builder actions
    const deploySpinner = createSpinner('Deploying App Builder actions...');
    const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
    const deployOutput = await execAsync(deployCommand);
    deploySpinner.succeed(formatSpinnerSuccess('App Builder actions deployed'));

    // Parse and display deployment URLs
    displayDeploymentUrls(deployOutput.stdout, environment);

    // Step 6: Update mesh if resolver was regenerated
    if (meshStatus.regenerated) {
      console.log(
        chalk.yellow('\n🔄 Mesh resolver was regenerated. Updating API Mesh automatically...\n')
      );

      const meshUpdateSuccess = await updateMeshWithRetry(isProd);

      if (!meshUpdateSuccess) {
        console.log(chalk.red('⚠️  Mesh update failed. You may need to run manually:'));
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
