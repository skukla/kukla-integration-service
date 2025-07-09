/**
 * App Deployment Step
 * Handles Adobe I/O App Builder deployment
 */

const { spawn } = require('child_process');

const chalk = require('chalk');

/**
 * Deploy App Builder application
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentStep(options = {}) {
  const { isProd = false } = options;

  console.log(chalk.blue('\n🔧 Deploying App Builder actions...\n'));

  const deployCommand = isProd ? 'aio app deploy --workspace=Production' : 'aio app deploy';
  const [cmd, ...args] = deployCommand.split(' ');

  const deployProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    deployProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(chalk.red(`\n❌ Deployment failed with exit code ${code}`));
        reject(new Error('Deployment failed'));
      } else {
        console.log(chalk.green('\n✅ App Builder deployment completed'));
        resolve();
      }
    });

    deployProcess.on('error', (err) => {
      console.log(chalk.red('\n❌ Failed to start deployment command'));
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
