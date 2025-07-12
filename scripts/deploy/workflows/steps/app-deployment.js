/**
 * App Deployment Step
 * Handles Adobe I/O App Builder deployment, letting CLI provide its own completion message
 */

const { spawn } = require('child_process');

const format = require('../../../core/formatting');

/**
 * Deploy App Builder application, relying on Adobe CLI for completion feedback
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentStep(options = {}) {
  const { isProd = false } = options;

  const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
  const [cmd, ...args] = deployCommand.split(' ');

  try {
    // Step 1: Start deployment with brief delay
    await format.sleep(300);

    // Step 2: Let Adobe CLI show its natural output and completion message
    const deployProcess = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      deployProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`App deployment failed with exit code ${code}`));
        } else {
          resolve();
        }
      });

      deployProcess.on('error', (err) => {
        reject(new Error(`Failed to start deployment command: ${err.message}`));
      });
    });

    // Brief pause after Adobe CLI output for clean separation
    await format.sleep(500);

    return {
      success: true,
      step: 'App Builder deployed successfully',
    };
  } catch (error) {
    console.log(format.error(`App deployment failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      step: 'App deployment failed',
    };
  }
}

module.exports = {
  appDeploymentStep,
};
