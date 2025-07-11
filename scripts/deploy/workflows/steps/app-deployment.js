/**
 * App Deployment Step
 * Handles Adobe I/O App Builder deployment
 * Following standardized deploy domain pattern
 */

const { spawn } = require('child_process');

const format = require('../../../core/formatting');

/**
 * Deploy App Builder application
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentStep(options = {}) {
  const { isProd = false } = options;

  console.log(format.info('Deploying App Builder actions'));

  const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
  const [cmd, ...args] = deployCommand.split(' ');

  // Standardized deploy domain command execution pattern
  const deployProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  try {
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

    console.log(format.success('✅ App Builder deployment completed'));
    return {
      success: true,
      step: 'App Builder deployed',
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
