/**
 * Mesh Status Check Step
 * Handles checking mesh resolver regeneration status
 */

const { operations } = require('../../../');

/**
 * Check mesh resolver status with user feedback
 * @returns {Promise<Object>} Mesh status result
 */
async function meshStatusCheckStep() {
  const meshCheckSpinner = operations.spinner.createSpinner('Checking mesh resolver status...');

  const meshStatus = await operations.mesh.checkMeshResolverRegeneration();

  meshCheckSpinner.succeed(
    operations.spinner.formatSpinnerSuccess(`Mesh resolver: ${meshStatus.reason}`)
  );
  await operations.command.sleep(500);

  return {
    success: true,
    meshStatus,
    step: `Mesh resolver: ${meshStatus.reason}`,
  };
}

module.exports = {
  meshStatusCheckStep,
};
