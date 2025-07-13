/**
 * Deploy Domain - Mesh Deployment Output Operations
 * Handles detailed progress output and summary generation for mesh deployment workflows
 */

const format = require('../../core/formatting');
const { createSpinner, succeedSpinner } = require('../../core/operations/spinner');

/**
 * Display initial setup with environment info
 * @param {string} environment - Environment name
 */
async function displayInitialSetup(environment) {
  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(
    format.deploymentStart(`Starting mesh deployment to ${environment.toLowerCase()}...`)
  );
  console.log();
  await format.sleep(800);
}

/**
 * Display mesh resolver generation progress with spinner
 * @param {Object} meshGenResult - Mesh generation result
 * @returns {Object} Spinner operations for success/failure
 */
function displayMeshGeneration(meshGenResult) {
  const generationSpinner = createSpinner('Checking mesh resolver...');

  const succeed = async () => {
    succeedSpinner(
      generationSpinner,
      `Mesh resolver ${meshGenResult.generated ? 'regenerated' : 'validated'}`
    );
    await format.sleep(400);
  };

  return { succeed };
}

/**
 * Display mesh deployment progress separator
 */
function displayMeshDeploymentSeparator() {
  console.log();
}

/**
 * Display completion celebration
 * @param {string} environment - Environment name
 */
async function displayCompletionSummary(environment) {
  console.log();
  console.log(format.celebration(`Mesh deployment to ${environment} completed successfully!`));
}

/**
 * Display mesh deployment error
 * @param {string} errorMessage - Error message
 */
function displayError(errorMessage) {
  console.log();
  console.log(format.error(`Mesh deployment failed: ${errorMessage}`));
}

module.exports = {
  displayInitialSetup,
  displayMeshGeneration,
  displayMeshDeploymentSeparator,
  displayCompletionSummary,
  displayError,
};
