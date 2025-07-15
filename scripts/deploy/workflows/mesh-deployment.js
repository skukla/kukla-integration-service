/**
 * Deploy Domain - Mesh Deployment Workflow
 * Handles mesh-only deployments with proper error handling
 */

const { meshUpdateStep } = require('./steps/mesh-update');
const { generateMeshCore } = require('../../build/operations/mesh-core-operations');
const { getEnvironmentString } = require('../../core/utils/environment');
const meshDeploymentOutput = require('../operations/mesh-deployment-output');

/**
 * Mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { isProd = false } = options;
  const environment = getEnvironmentString(isProd);

  try {
    // Step 1: Display initial mesh setup
    await meshDeploymentOutput.displayInitialSetup(environment);

    // Step 2: Generate mesh resolver
    const meshResult = await generateMeshCore({ isProd });

    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    // Step 3: Deploy mesh
    await meshDeploymentOutput.displayMeshDeployment();

    const meshUpdateResult = await meshUpdateStep({ isProd });

    if (!meshUpdateResult.success) {
      throw new Error(meshUpdateResult.error);
    }

    await meshDeploymentOutput.displayCompletionSummary(environment);

    return {
      success: true,
      environment,
      meshRegenerated: meshResult.generated,
      meshUpdateResult,
    };
  } catch (error) {
    meshDeploymentOutput.displayError(error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  meshDeploymentWorkflow,
};
