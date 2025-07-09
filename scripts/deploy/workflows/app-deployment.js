/**
 * App Deployment Workflow
 * Extracted from scripts/deploy.js for domain organization
 * Orchestrates complete application deployment with mesh updates
 */

const chalk = require('chalk');

const steps = require('./steps');

/**
 * Main application deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Deploy to production
 * @param {boolean} options.skipBuild - Skip build process
 * @param {boolean} options.skipMesh - Skip mesh updates
 * @param {boolean} options.meshOnly - Only update mesh (skip app deployment)
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentWorkflow(options = {}) {
  const { isProd = false, skipBuild = false, skipMesh = false, meshOnly = false } = options;
  const environment = isProd ? 'production' : 'staging';

  try {
    // Handle mesh-only deployment
    if (meshOnly) {
      return await steps.meshOnlyDeployment.meshOnlyDeploymentStep({
        isProd,
        environment,
      });
    }

    console.log(chalk.bold.cyan(`\n🚀 Starting deployment to ${environment}...\n`));

    // Step 1: Environment Detection
    const envResult = await steps.environmentDetection.environmentDetectionStep();

    // Step 2: Clean build artifacts
    const cleanResult = await steps.buildCleaning.buildCleaningStep();

    // Step 3: Run build process (if not skipped)
    const buildResult = await steps.buildProcess.buildProcessStep({ skipBuild, skipMesh });

    // Step 4: Check mesh resolver status
    const meshStatusResult = await steps.meshStatusCheck.meshStatusCheckStep();

    // Step 5: Deploy App Builder actions
    const deployResult = await steps.appDeployment.appDeploymentStep({ isProd });

    // Step 6: Update mesh if needed and not skipped
    const meshUpdateResult = await steps.meshUpdate.meshUpdateStep({
      isProd,
      skipMesh,
      meshStatus: meshStatusResult.meshStatus,
    });

    console.log(chalk.bold.green(`\n🎉 Deployment to ${environment} completed successfully!\n`));

    return {
      success: true,
      environment,
      isProd,
      meshUpdated: !skipMesh && meshStatusResult.meshStatus.wasRegenerated,
      steps: [
        envResult.step,
        cleanResult.step,
        buildResult.step,
        deployResult.step,
        meshUpdateResult.step,
      ],
    };
  } catch (error) {
    console.log(chalk.red(`Deployment to ${environment} failed: ${error.message}`));
    throw error;
  }
}

module.exports = {
  appDeploymentWorkflow,
};
