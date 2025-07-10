/**
 * Deploy Domain - Mesh Deployment Workflow
 * Clean orchestrator pattern for mesh-only deployment
 */

const { detectEnvironment } = require('../../../src/core/environment');
const format = require('../../core/formatting');

/**
 * Mesh deployment workflow - Clean orchestrator pattern
 * Single function that orchestrates mesh-only deployment operations
 * @param {Object} options - Deployment options
 * @param {boolean} options.verbose - Enable verbose output
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { verbose = false } = options;
  const steps = [];

  try {
    // Step 1: Environment detection
    const detectedEnv = detectEnvironment({}, { allowCliDetection: true });
    console.log(format.success(`Environment detected: ${format.environment(detectedEnv)}`));
    steps.push(`Successfully detected ${detectedEnv} environment`);

    // Step 2: Mesh update
    console.log(format.info('Updating API Mesh configuration...'));

    // Import step modules
    const { meshUpdate } = require('./steps');
    const meshResult = await meshUpdate.meshUpdateStep({ environment: detectedEnv, verbose });

    if (!meshResult.success) {
      throw new Error(meshResult.error);
    }

    console.log(format.success('API Mesh updated successfully'));
    steps.push('Successfully updated API Mesh configuration');

    // Final status display
    console.log();
    console.log(format.status('SUCCESS', 200));
    console.log(format.section('Message: Mesh deployment completed successfully'));
    console.log();
    console.log(format.section('Steps:'));
    console.log(format.steps(steps));

    return {
      success: true,
      environment: detectedEnv,
      steps,
    };
  } catch (error) {
    console.log(format.error(`Mesh deployment failed: ${error.message}`));
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
