/**
 * Mesh Only Deployment Step
 * Handles mesh-only deployment operations
 */

const { spawn } = require('child_process');

const { basicFormatters } = require('../../../core/utils');
const { COLORS } = require('../../../core/utils/output-constants');

/**
 * Deploy only the API Mesh
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function meshOnlyDeploymentStep(options = {}) {
  const { isProd = false } = options;

  console.log(COLORS.header('\nDeploying API Mesh only...\n'));

  const meshCommand = isProd
    ? 'aio api-mesh update mesh.json --env=prod'
    : 'aio api-mesh update mesh.json';
  const [cmd, ...args] = meshCommand.split(' ');

  const meshProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    meshProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(basicFormatters.error(`Mesh deployment failed with exit code ${code}`));
        reject(new Error('Mesh deployment failed'));
      } else {
        console.log(basicFormatters.success('API Mesh deployment completed'));
        resolve();
      }
    });

    meshProcess.on('error', (err) => {
      console.log(basicFormatters.error('Failed to start mesh deployment command'));
      reject(err);
    });
  });

  return {
    success: true,
    step: 'API Mesh deployed',
  };
}

module.exports = {
  meshOnlyDeploymentStep,
};
