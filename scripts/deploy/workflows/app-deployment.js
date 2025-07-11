/**
 * Deploy Domain - App Deployment Workflow
 * Direct step-based orchestration following Light DDD principles
 */

// Direct step imports - Light DDD approach
const { appDeploymentStep } = require('./steps/app-deployment');
const { buildProcessStep } = require('./steps/build-process');
const { meshUpdateStep } = require('./steps/mesh-update');
const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { buildActionUrl, buildStaticAppUrl } = require('../operations/url-building');

/**
 * App deployment workflow - Direct step orchestration
 * Clean orchestrator that calls step functions directly
 * @param {Object} options - Deployment options
 * @param {string} options.environment - Target environment

 * @param {boolean} options.skipMesh - Skip mesh updates
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentWorkflow(options = {}) {
  const { isProd = false, skipMesh = false } = options;
  const environment = getEnvironmentString(isProd);
  const steps = [];

  try {
    // Step 1: Environment setup - Simple boolean logic
    steps.push(`Successfully configured for ${environment} environment`);

    // Step 2: Build process
    const buildResult = await buildProcessStep({ environment });
    if (!buildResult.success) {
      throw new Error(buildResult.error);
    }
    steps.push(buildResult.step);

    // Step 3: App deployment
    const deployResult = await appDeploymentStep({
      isProd,
    });
    if (!deployResult.success) {
      throw new Error('App deployment failed');
    }
    steps.push(deployResult.step);

    // Step 4: Mesh update (if needed)
    const meshResult = await meshUpdateStep({
      isProd,
      skipMesh,
    });
    if (!meshResult.success && !meshResult.skipped) {
      console.log(format.warning('Mesh update failed, but deployment completed successfully'));
    }
    steps.push(meshResult.step);

    // Final status
    console.log(); // Blank line
    console.log(format.status('SUCCESS', 200));
    console.log(format.section('Message: Deployment completed successfully'));

    // Build URLs for output
    const appUrl = buildStaticAppUrl(isProd);
    const downloadUrl = buildActionUrl('download-file', {}, isProd);

    console.log();
    console.log(format.url(appUrl));
    console.log(format.downloadUrl(downloadUrl));

    console.log();
    console.log(format.section('Steps:'));
    console.log(format.steps(steps));

    return {
      success: true,
      environment,
      steps,
      urls: {
        app: appUrl,
        download: downloadUrl,
      },
    };
  } catch (error) {
    console.log(format.error(`Deployment failed: ${error.message}`));
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
