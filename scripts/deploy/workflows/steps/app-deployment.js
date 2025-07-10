/**
 * App Deployment Step
 * Handles Adobe I/O App Builder deployment
 */

const { spawn } = require('child_process');

const format = require('../../../format');

/**
 * Deploy App Builder application
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentStep(options = {}) {
  const { isProd = false } = options;

  console.log(format.section('Deploying App Builder actions'));

  const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
  const [cmd, ...args] = deployCommand.split(' ');

  const deployProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    deployProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(format.error(`Deployment failed with exit code ${code}`));
        reject(new Error('Deployment failed'));
      } else {
        console.log(format.success('App Builder deployment completed'));
        resolve();
      }
    });

    deployProcess.on('error', (err) => {
      console.log(format.error('Failed to start deployment command'));
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
