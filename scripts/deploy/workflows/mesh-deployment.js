/**
 * Deploy Domain - Mesh Deployment Workflow
 * Clean spinner-based mesh deployment workflow
 */

const { meshUpdateStep } = require('./steps/mesh-update');
const { generateMeshResolver } = require('../../build/workflows/mesh-generation');
const format = require('../../core/formatting');
const { createSpinner, succeedSpinner } = require('../../core/operations/spinner');
const { getEnvironmentString } = require('../../core/utils/environment');

/**
 * Mesh deployment workflow
 * @param {Object} options - Deployment options
 * @param {boolean} options.isProd - Whether deploying to production
 * @returns {Promise<Object>} Deployment result
 */
async function meshDeploymentWorkflow(options = {}) {
  const { isProd = false } = options;
  const environment = getEnvironmentString(isProd);
  const steps = [];

  try {
    // Step 1: Initial setup
    console.log(format.success(`Environment: ${format.environment(environment)}`));
    console.log();
    console.log(
      format.deploymentStart(`Starting mesh deployment to ${environment.toLowerCase()}...`)
    );
    console.log();

    // Brief pause for better flow
    await format.sleep(800);

    // Step 2: Mesh generation
    const generationSpinner = createSpinner('Checking mesh resolver...');

    const meshGenResult = await generateMeshResolver({ isProd });
    if (!meshGenResult.success) {
      throw new Error(meshGenResult.error);
    }

    succeedSpinner(
      generationSpinner,
      `Mesh resolver ${meshGenResult.generated ? 'regenerated' : 'validated'}`
    );
    await format.sleep(400);

    steps.push(
      `Successfully ${meshGenResult.generated ? 'regenerated' : 'validated'} mesh resolver`
    );

    // Pause before mesh deployment
    await format.sleep(1000);

    // Step 3: Mesh deployment
    console.log();

    const meshResult = await meshUpdateStep({
      isProd,
      skipMesh: false,
      meshRegenerated: meshGenResult.generated,
    });

    if (!meshResult.success && !meshResult.skipped) {
      throw new Error(meshResult.error);
    }

    if (!meshResult.skipped) {
      steps.push('Successfully updated API Mesh configuration');
    }

    // Step 4: Final completion
    console.log();
    console.log(format.celebration(`Mesh deployment to ${environment} completed successfully!`));

    return {
      success: true,
      environment,
      steps,
    };
  } catch (error) {
    console.log();
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
