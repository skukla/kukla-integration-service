/**
 * App Deployment Workflow
 * High-level orchestration for application deployment processes
 */

const { basicFormatters } = require('../../core/utils');
const { outputTemplates } = require('../operations');

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
    console.log(outputTemplates.deploymentStart(environment));

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
    if (verbose) console.log(basicFormatters.info('Starting build process...'));
    const buildResult = await buildProcess.executeBuildProcess({ verbose });
    if (!buildResult.success) {
      throw new Error(buildResult.error);
    }

    // Step 3: App deployment
    if (verbose) console.log(basicFormatters.info('Starting app deployment...'));
    const deployResult = await appDeployment.executeAppDeployment({ environment, verbose });
    if (!deployResult.success) {
      throw new Error(deployResult.error);
    }

    // Step 4: Mesh update
    if (verbose) console.log(basicFormatters.info('Starting mesh update...'));
    const meshResult = await meshUpdate.executeMeshUpdate({ environment, verbose });
    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    console.log(outputTemplates.deploymentComplete(environment));

    return {
      success: true,
      environment,
      steps: ['Environment detection', 'Build process', 'App deployment', 'Mesh update'],
    };
  } catch (error) {
    console.error(basicFormatters.error(`App deployment failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  appDeploymentWorkflow,
};
