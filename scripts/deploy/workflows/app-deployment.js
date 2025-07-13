/**
 * Deploy Domain - App Deployment Workflow
 * Clean orchestrator for deployment process following Light DDD standards
 */

// Direct step imports - Light DDD approach
const { appDeploymentStep } = require('./steps/app-deployment');
const { buildProcessStep } = require('./steps/build-process');
const { meshUpdateStep } = require('./steps/mesh-update');
const { getEnvironmentString } = require('../../core/utils/environment');
const { appDeploymentOutput } = require('../operations');

/**
 * App deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @param {boolean} options.skipMesh - Skip mesh updates
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentWorkflow(options = {}) {
  const { isProd = false, skipMesh = false } = options;
  const environment = getEnvironmentString(isProd);
  const steps = [];

  try {
    // Step 1: Initial setup with environment info
    await appDeploymentOutput.displayInitialSetup(environment);

    // Step 2: Build process
    const buildResult = await buildProcessStep({ environment });
    if (!buildResult.success) {
      throw new Error(buildResult.error);
    }
    steps.push(buildResult.step);

    // Step 3: Deploy App Builder actions
    await appDeploymentOutput.displayAppDeployment();

    const deployResult = await appDeploymentStep({
      isProd,
    });
    if (!deployResult.success) {
      throw new Error('App deployment failed');
    }
    steps.push(deployResult.step);

    // Step 4: Update API Mesh (only if mesh resolver was regenerated)
    if (!skipMesh && buildResult.meshRegenerated) {
      await appDeploymentOutput.displayMeshUpdate();

      const meshResult = await meshUpdateStep({
        isProd,
        skipMesh,
        meshRegenerated: buildResult.meshRegenerated,
      });
      if (!meshResult.success && !meshResult.skipped) {
        appDeploymentOutput.displayMeshUpdateWarning();
      }
      if (!meshResult.skipped) {
        steps.push(meshResult.step);
      }
    }

    // Step 5: Final completion
    await appDeploymentOutput.displayCompletionSummary(environment);

    return {
      success: true,
      environment,
      steps,
    };
  } catch (error) {
    appDeploymentOutput.displayError(error.message);
    return {
      success: false,
      error: error.message,
      steps,
    };
  }
}

module.exports = {
  appDeploymentWorkflow,
};
