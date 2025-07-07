/**
 * Enhanced deployment script with automatic mesh update handling
 * Automatically detects when mesh resolvers change and updates API Mesh
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const ora = require('ora');

const { updateMeshWithRetry } = require('./lib/mesh-utils');
const { detectEnvironment } = require('../src/shared/environment');

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

// updateMeshWithRetry function now imported from shared mesh-utils module

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
        // Shared helper now uses optimized defaults: 2 checks for staging, 4 for production
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
module.exports = { deploy };

// Run deployment if called directly
if (require.main === module) {
  deploy();
}
