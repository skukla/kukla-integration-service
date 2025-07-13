/**
 * Deploy Domain - App Deployment Output Operations
 * Handles detailed progress output and summary generation for deployment workflows
 */

const format = require('../../core/formatting');

/**
 * Display initial setup with environment info
 * @param {string} environment - Environment name
 */
async function displayInitialSetup(environment) {
  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(format.deploymentStart(`Starting deployment to ${environment.toLowerCase()}...`));
  console.log();
  await format.sleep(800);
}

/**
 * Display App Builder deployment progress
 */
async function displayAppDeployment() {
  console.log();
  console.log(format.deploymentAction('Deploying App Builder actions...'));
  console.log();
  await format.sleep(1000);
}

/**
 * Display API Mesh update progress
 */
async function displayMeshUpdate() {
  console.log();
  console.log(format.deploymentAction('Updating API Mesh...'));
  console.log();
  await format.sleep(1000);
}

/**
 * Display mesh update warning
 */
function displayMeshUpdateWarning() {
  console.log(format.warning('Mesh update failed, but deployment completed successfully'));
}

/**
 * Display completion celebration
 * @param {string} environment - Environment name
 */
async function displayCompletionSummary(environment) {
  console.log();
  console.log(
    format.celebration(`Deployment to ${environment.toLowerCase()} completed successfully!`)
  );
}

/**
 * Display deployment error
 * @param {string} errorMessage - Error message
 */
function displayError(errorMessage) {
  console.log();
  console.log(format.error(`Deployment failed: ${errorMessage}`));
}

module.exports = {
  displayInitialSetup,
  displayAppDeployment,
  displayMeshUpdate,
  displayMeshUpdateWarning,
  displayCompletionSummary,
  displayError,
};
