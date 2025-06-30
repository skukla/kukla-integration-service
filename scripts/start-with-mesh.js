/**
 * Enhanced start script with automatic mesh updates
 * Combines build + deploy + mesh update workflow
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const chalk = require('chalk');
const ora = require('ora');

// Environment detection not needed for this script

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
 * Update API Mesh with retry logic (simplified version for npm start)
 */
async function updateMeshWithRetry(maxRetries = 2) {
  const waitTimeInSeconds = 45; // Shorter wait for dev workflow

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(chalk.cyan(`\n🔄 Mesh update attempt ${attempt}/${maxRetries}...\n`));

      // Update the mesh
      const updateCommand = 'aio api-mesh:update mesh.json --autoConfirmAction';
      const updateSpinner = createSpinner('Updating API Mesh...');
      await execAsync(updateCommand);
      updateSpinner.succeed(formatSpinnerSuccess('Mesh update command sent'));

      // Wait for mesh to provision (shorter wait for dev)
      const waitSpinner = createSpinner(`Waiting ${waitTimeInSeconds}s for mesh provisioning...`);
      await sleep(waitTimeInSeconds * 1000);
      waitSpinner.succeed(formatSpinnerSuccess('Wait complete'));

      // Quick status check
      const statusSpinner = createSpinner('Checking mesh status...');
      const statusOutput = await execAsync('aio api-mesh:status');
      statusSpinner.succeed(formatSpinnerSuccess('Mesh status checked'));

      if (statusOutput.stdout.includes('success')) {
        console.log(chalk.bold.green('✅ Mesh update successful!\n'));
        return true;
      } else if (attempt < maxRetries) {
        console.log(chalk.yellow(`⚠️  Retrying mesh update... (${attempt}/${maxRetries})\n`));
        await sleep(5000);
      } else {
        console.log(chalk.red('❌ Mesh update may need manual verification\n'));
        return false;
      }
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(chalk.yellow(`⚠️  Retry ${attempt}: ${error.message}\n`));
        await sleep(5000);
      } else {
        console.log(chalk.red(`❌ Mesh update failed: ${error.message}\n`));
        return false;
      }
    }
  }

  return false;
}

/**
 * Main start function with mesh updates
 */
async function start() {
  try {
    console.log(chalk.bold.cyan('\n🚀 Starting development deployment with mesh automation...\n'));

    // Step 1: Run build process
    const buildSpinner = createSpinner('Running build process...');
    await execAsync('node scripts/build.js');
    buildSpinner.succeed(formatSpinnerSuccess('Build completed'));

    // Step 2: Check mesh status before deployment
    const meshCheckSpinner = createSpinner('Checking mesh resolver status...');
    const meshStatus = await checkMeshResolverRegeneration();
    meshCheckSpinner.succeed(formatSpinnerSuccess(`Mesh: ${meshStatus.reason}`));

    // Step 3: Deploy with live output
    console.log(chalk.cyan('\n📦 Deploying application...\n'));

    const deployCommand = 'aio app deploy';
    const [cmd, ...args] = deployCommand.split(' ');

    await new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: 'inherit', shell: true });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Deployment failed with exit code ${code}`));
        } else {
          console.log(chalk.green('\n✅ Deployment completed!\n'));
          resolve();
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });

    // Step 4: Update mesh if needed
    if (meshStatus.regenerated) {
      console.log(chalk.yellow('🔄 Mesh resolver changed. Updating API Mesh...\n'));

      const meshUpdateSuccess = await updateMeshWithRetry();

      if (!meshUpdateSuccess) {
        console.log(chalk.yellow('⚠️  Mesh update may need manual verification:'));
        console.log(chalk.cyan('   npm run deploy:mesh\n'));
      }
    } else {
      console.log(chalk.green('✅ Mesh resolver unchanged. No update needed.\n'));
    }

    console.log(chalk.bold.green('🎉 Development deployment completed!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Start failed:'), error.message);
    process.exit(1);
  }
}

// Run start if called directly
if (require.main === module) {
  start();
}

module.exports = { start };
