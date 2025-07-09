/**
 * Mesh Deployment Workflow
 * High-level orchestration for mesh-only deployment processes
 */

const { meshTemplates } = require('../../core/operations');
const { basicFormatters } = require('../../core/utils');

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
    console.log(meshTemplates.meshStartEmphasis(environment));

    // Import step modules
    const { environmentDetection } = require('./steps');
    const { meshUpdate } = require('./steps');

    // Step 1: Environment detection
    const envResult = await environmentDetection.detectAndValidateEnvironment(environment);
    if (!envResult.success) {
      throw new Error(envResult.error);
    }

    // Step 2: Mesh update
    if (verbose) console.log(basicFormatters.info('Starting mesh update...'));
    const meshResult = await meshUpdate.executeMeshUpdate({ environment, verbose });
    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    console.log(meshTemplates.meshCompleteEmphasis(environment));

    return {
      success: true,
      environment,
      steps: ['Environment detection', 'Mesh update'],
    };
  } catch (error) {
    console.error(basicFormatters.error(`Mesh deployment failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  meshDeploymentWorkflow,
};
