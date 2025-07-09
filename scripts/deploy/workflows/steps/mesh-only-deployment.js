/**
 * Mesh Only Deployment Step
 * Handles mesh-only deployment workflow
 */

// Direct imports to avoid scripts index import issues
const { updateMeshWithRetry } = require('../../../core/operations/mesh');
const { FORMATTERS, COLORS } = require('../../../core/operations/output-standards');

/**
 * Execute mesh-only deployment
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @param {string} options.environment - Environment name for display
 * @returns {Promise<Object>} Deployment result
 */
async function meshOnlyDeploymentStep(options = {}) {
  const { isProd = false, environment = 'staging' } = options;

  console.log(COLORS.header(`\nUpdating API Mesh for ${environment}...\n`));

  const meshUpdateSuccess = await updateMeshWithRetry({
    isProd,
    waitTimeSeconds: isProd ? 60 : 45,
    maxStatusChecks: isProd ? 3 : 3,
  });

  if (meshUpdateSuccess) {
    console.log(FORMATTERS.success(`Mesh update to ${environment} completed successfully`));

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
