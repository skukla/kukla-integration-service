/**
 * Mesh Deployment Workflow
 * High-level orchestration for mesh-only deployment processes
 */

const format = require('../../format');

/**
 * Mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {string} options.environment - Target environment
 * @param {boolean} options.verbose - Enable verbose output
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { environment = 'staging', verbose = false } = options;

  try {
    console.log(await format.meshStart(environment));

    // Import step modules
    const { environmentDetection } = require('./steps');
    const { meshUpdate } = require('./steps');

    // Step 1: Environment detection
    const envResult = await environmentDetection.detectAndValidateEnvironment(environment);
    if (!envResult.success) {
      throw new Error(envResult.error);
    }

    // Step 2: Mesh update
    if (verbose) console.log(format.verbose('Starting mesh update...'));
    const meshResult = await meshUpdate.meshUpdateStep({ environment, verbose });
    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    console.log(await format.meshDone(environment));

    return {
      success: true,
      environment,
      steps: ['Environment detection', 'Mesh update'],
    };
  } catch (error) {
    console.error(format.error(`Mesh deployment failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  meshDeploymentWorkflow,
};
