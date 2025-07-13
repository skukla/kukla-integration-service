/**
 * Deploy Domain - Mesh Deployment Workflow
 * Clean orchestrator for mesh deployment following Light DDD standards
 */

const { meshUpdateStep } = require('./steps/mesh-update');
const { getEnvironmentString } = require('../../core/utils/environment');
const { meshDeploymentOutput } = require('../operations');

/**
 * Mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { isProd = false } = options;
  const environment = getEnvironmentString(isProd);
  const steps = [];

  try {
    // Step 1: Initial setup with environment info
    await meshDeploymentOutput.displayInitialSetup(environment);

    // Step 2: Mesh generation (use core operations for deployment)
    const { meshCoreOperations } = require('../../build/operations');
    const meshGenResult = await meshCoreOperations.generateMeshCore({ isProd });
    if (!meshGenResult.success) {
      throw new Error(meshGenResult.error);
    }

    const meshGenSpinner = meshDeploymentOutput.displayMeshGeneration(meshGenResult);
    await meshGenSpinner.succeed();

    steps.push(
      `Successfully ${meshGenResult.generated ? 'regenerated' : 'validated'} mesh resolver`
    );

    // Pause before mesh deployment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Mesh deployment
    meshDeploymentOutput.displayMeshDeploymentSeparator();

    const meshResult = await meshUpdateStep({
      isProd,
      skipMesh: false,
      meshRegenerated: meshGenResult.generated,
    });

    if (!meshResult.success && !meshResult.skipped) {
      throw new Error(meshResult.error);
    }

    if (!meshResult.skipped) {
      steps.push('Successfully updated API Mesh configuration');
    }

    // Step 4: Final completion
    await meshDeploymentOutput.displayCompletionSummary(environment);

    return {
      success: true,
      environment,
      steps,
    };
  } catch (error) {
    meshDeploymentOutput.displayError(error.message);
    return {
      success: false,
      error: error.message,
      steps,
    };
  }
}

module.exports = {
  meshDeploymentWorkflow,
};
