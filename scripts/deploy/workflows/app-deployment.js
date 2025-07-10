/**
 * App Deployment Workflow
 * High-level orchestration for application deployment processes
 */

const format = require('../../format');

/**
 * Application deployment workflow
 * @param {Object} options - Deployment options
 * @param {string} options.environment - Target environment
 * @param {boolean} options.verbose - Enable verbose output
 * @returns {Promise<Object>} Deployment result
 */
async function appDeploymentWorkflow(options = {}) {
  const { environment = 'staging', verbose = false } = options;

  try {
    console.log(await format.deployStart(environment));

    // Import step modules
    const { environmentDetection } = require('./steps');
    const { buildProcess } = require('./steps');
    const { appDeployment } = require('./steps');
    const { meshUpdate } = require('./steps');

    // Step 1: Environment detection
    const envResult = await environmentDetection.detectAndValidateEnvironment(environment);
    if (!envResult.success) {
      throw new Error(envResult.error);
    }

    // Step 2: Build process
    if (verbose) console.log(format.verbose('Starting build process...'));
    const buildResult = await buildProcess.buildProcessStep({ verbose });
    if (!buildResult.success) {
      throw new Error(buildResult.error);
    }

    // Step 3: App deployment
    if (verbose) console.log(format.verbose('Starting app deployment...'));
    const deployResult = await appDeployment.appDeploymentStep({ environment, verbose });
    if (!deployResult.success) {
      throw new Error(deployResult.error);
    }

    // Step 4: Mesh update
    if (verbose) console.log(format.verbose('Starting mesh update...'));
    const meshResult = await meshUpdate.meshUpdateStep({ environment, verbose });
    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    console.log(await format.deployDone(environment));

    return {
      success: true,
      environment,
      steps: ['Environment detection', 'Build process', 'App deployment', 'Mesh update'],
    };
  } catch (error) {
    console.error(format.error(`App deployment failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  appDeploymentWorkflow,
};
