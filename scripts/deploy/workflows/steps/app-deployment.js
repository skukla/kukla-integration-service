/**
 * App Deployment Step
 * Handles Adobe I/O App Builder deployment
 */

const { spawn } = require('child_process');

const { FORMATTERS, COLORS } = require('../../../core/operations/output-standards');

/**
 * Deploy App Builder application
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentStep(options = {}) {
  const { isProd = false } = options;

  console.log(COLORS.header('\nDeploying App Builder actions...\n'));

  const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
  const [cmd, ...args] = deployCommand.split(' ');

  const deployProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    deployProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(FORMATTERS.error(`Deployment failed with exit code ${code}`));
        reject(new Error('Deployment failed'));
      } else {
        console.log(FORMATTERS.success('App Builder deployment completed'));
        resolve();
      }
    });

    deployProcess.on('error', (err) => {
      console.log(FORMATTERS.error('Failed to start deployment command'));
      reject(err);
    });
  });

  return {
    success: true,
    step: 'App Builder deployed',
  };
}

module.exports = {
  appDeploymentStep,
};
