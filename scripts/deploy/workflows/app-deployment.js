/**
 * Deploy Domain - App Deployment Workflow
 * Clean orchestrator pattern following established codebase conventions
 */

const format = require('../../core/formatting');
const {
  detectEnvironment,
  buildApplication,
  deployToAdobeIO,
  updateMesh,
} = require('../operations');

/**
 * App deployment workflow - Clean orchestrator pattern
 * Single function that orchestrates all deployment operations
 * @param {Object} options - Deployment options
 * @param {string} options.environment - Target environment
 * @param {boolean} options.verbose - Enable verbose output
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentWorkflow(options = {}) {
  const { environment, verbose = false } = options;
  const steps = [];

  try {
    // Step 1: Environment detection and validation
    const detectedEnv = await detectEnvironment(environment);
    console.log(format.success(`Environment detected: ${format.environment(detectedEnv)}`));
    steps.push(`Successfully detected ${detectedEnv} environment`);

    // Step 2: Build application
    await buildApplication(detectedEnv, verbose);
    console.log(format.success('Build process completed'));
    steps.push(`Successfully built application for ${detectedEnv}`);

    // Step 3: Deploy to Adobe I/O
    const deployResult = await deployToAdobeIO(detectedEnv, verbose);
    console.log(format.success('App deployed to Adobe I/O Runtime'));
    console.log(format.url(deployResult.appUrl));
    steps.push(`Successfully deployed ${deployResult.actionCount} actions to Adobe I/O Runtime`);

    // Step 4: Update mesh (if needed)
    const meshResult = await updateMesh(detectedEnv, verbose);
    if (meshResult.updated) {
      console.log(format.success('API Mesh updated successfully'));
      steps.push('Successfully updated API Mesh configuration');
    } else {
      steps.push('API Mesh unchanged (no update needed)');
    }

    // Final status
    console.log(); // Blank line
    console.log(format.status('SUCCESS', 200));
    console.log(format.section('Message: Deployment completed successfully'));

    if (deployResult.downloadUrl) {
      console.log(); // Blank line
      console.log(format.downloadUrl(deployResult.downloadUrl));
    }

    console.log(); // Blank line
    console.log(format.section('Steps:'));
    console.log(format.steps(steps));

    return {
      success: true,
      environment: detectedEnv,
      steps,
      urls: {
        app: deployResult.appUrl,
        download: deployResult.downloadUrl,
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
