/**
 * Mesh Deployment Workflow
 * Clean orchestrator following refactoring standards
 *
 * Pure orchestration that coordinates mesh deployment operations
 * without handling presentation logic or business details.
 */

const { compileMeshConfig } = require('./compile');
const { updateMeshWithRetry } = require('../operations/deployment');

/**
 * Execute complete mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {string} options.environment - Target environment (staging|production)
 * @param {boolean} options.skipCompilation - Skip compilation step
 * @param {boolean} options.skipDeployment - Skip deployment step (compile only)
 * @param {Object} options.config - Configuration object
 * @param {Function} options.onEvent - Event handler for deployment operations
 * @returns {Promise<Object>} Deployment result
 */
async function deployMeshWorkflow({
  environment = 'staging',
  skipCompilation = false,
  skipDeployment = false,
  config,
  onEvent,
}) {
  const steps = [];

  try {
    // Step 1: Compile mesh configuration (if not skipped)
    let compilationResult = null;
    if (!skipCompilation) {
      compilationResult = await compileMeshConfig({ config });
      steps.push('Mesh compilation');

      if (!compilationResult.success) {
        throw new Error(`Mesh compilation failed: ${compilationResult.error}`);
      }
    } else {
      steps.push('Mesh compilation (skipped)');
    }

    // Step 2: Deploy mesh (if not skipped)
    let deploymentResult = null;
    if (!skipDeployment) {
      deploymentResult = await updateMeshWithRetry({
        environment,
        onEvent,
      });
      steps.push('Mesh deployment');

      if (!deploymentResult.success) {
        throw new Error(`Mesh deployment failed: ${deploymentResult.message || 'Unknown error'}`);
      }
    } else {
      steps.push('Mesh deployment (skipped)');
    }

    return {
      success: true,
      workflow: `Mesh deployment to ${environment} completed successfully`,
      environment,
      steps,
      results: {
        compilation: compilationResult,
        deployment: deploymentResult,
      },
    };
  } catch (error) {
    return {
      success: false,
      workflow: `Mesh deployment to ${environment} failed`,
      environment,
      error: error.message,
      steps,
      completedSteps: steps.length,
    };
  }
}

/**
 * Simple mesh deployment with default options
 * @param {Object} options - Optional configuration overrides
 * @param {string} options.environment - Target environment
 * @returns {Promise<Object>} Deployment result
 */
async function deployMesh(options = {}) {
  return deployMeshWorkflow(options);
}

module.exports = {
  deployMeshWorkflow,
  deployMesh,
};
