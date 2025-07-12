/**
 * Deploy Domain - App Deployment Workflow
 * Clean spinner-based deployment flow without redundant messages
 */

// Direct step imports - Light DDD approach
const { appDeploymentStep } = require('./steps/app-deployment');
const { buildProcessStep } = require('./steps/build-process');
const { meshUpdateStep } = require('./steps/mesh-update');
const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');

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
    // Step 1: Initial setup
    console.log(format.success(`Environment: ${format.environment(environment)}`));
    console.log();
    console.log(format.deploymentStart(`Starting deployment to ${environment.toLowerCase()}...`));
    console.log();

    // Brief pause for better flow
    await format.sleep(800);

    // Step 2: Build process
    const buildResult = await buildProcessStep({ environment });
    if (!buildResult.success) {
      throw new Error(buildResult.error);
    }
    steps.push(buildResult.step);

    // Pause before deployment
    await format.sleep(1000);

    // Step 3: Deploy App Builder actions
    console.log();
    console.log(format.deploymentAction('Deploying App Builder actions...'));
    console.log();

    const deployResult = await appDeploymentStep({
      isProd,
    });
    if (!deployResult.success) {
      throw new Error('App deployment failed');
    }
    steps.push(deployResult.step);

    // Step 4: Update API Mesh (only if mesh resolver was regenerated)
    if (!skipMesh && buildResult.meshRegenerated) {
      await format.sleep(1000);

      console.log();
      console.log(format.deploymentAction('Updating API Mesh...'));
      console.log();

      const meshResult = await meshUpdateStep({
        isProd,
        skipMesh,
        meshRegenerated: buildResult.meshRegenerated,
      });
      if (!meshResult.success && !meshResult.skipped) {
        console.log(format.warning('Mesh update failed, but deployment completed successfully'));
      }
      if (!meshResult.skipped) {
        steps.push(meshResult.step);
      }
    }

    // Step 6: Final completion
    console.log();
    console.log(
      format.celebration(`Deployment to ${environment.toLowerCase()} completed successfully!`)
    );

    return {
      success: true,
      environment,
      steps,
    };
  } catch (error) {
    console.log();
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
