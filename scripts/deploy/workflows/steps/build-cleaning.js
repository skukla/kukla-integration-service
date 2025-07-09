/**
 * Build Cleaning Step
 * Handles cleaning of build artifacts
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const { operations } = require('../../../');

const execAsync = promisify(exec);

/**
 * Clean build artifacts with user feedback
 * @returns {Promise<Object>} Cleaning result
 */
async function buildCleaningStep() {
  const cleanSpinner = operations.spinner.createSpinner('Cleaning build artifacts...');

  await execAsync('npm run clean');

  cleanSpinner.succeed(operations.spinner.formatSpinnerSuccess('Build artifacts cleaned'));
  await operations.sleep(300);

  return {
    success: true,
    step: 'Build artifacts cleaned',
  };
}

module.exports = {
  buildCleaningStep,
};
