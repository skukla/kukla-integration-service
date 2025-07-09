/**
 * Mesh-Only Deployment Step
 * Handles standalone mesh updates without app deployment
 */

const chalk = require('chalk');

const { operations } = require('../../../');

/**
 * Execute mesh-only deployment
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @param {string} options.environment - Environment name for display
 * @returns {Promise<Object>} Deployment result
 */
async function meshOnlyDeploymentStep(options = {}) {
  const { isProd = false, environment = 'staging' } = options;

  console.log(chalk.bold.cyan(`\n🔄 Updating API Mesh for ${environment}...\n`));

  const meshUpdateSuccess = await operations.mesh.updateMeshWithRetry({
    isProd,
    waitTimeSeconds: isProd ? 90 : 30,
    maxStatusChecks: isProd ? 10 : 2,
  });

  if (meshUpdateSuccess) {
    console.log(chalk.bold.green(`\n✅ Mesh update to ${environment} completed successfully!\n`));

    return {
      success: true,
      environment,
      isProd,
      meshUpdated: true,
      steps: ['Mesh updated'],
    };
  } else {
    throw new Error('Mesh update failed');
  }
}

module.exports = {
  meshOnlyDeploymentStep,
};
