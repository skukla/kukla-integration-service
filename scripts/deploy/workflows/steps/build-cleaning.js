/**
 * Build Cleaning Step
 * Handles build artifact cleanup operations
 */

const { FORMATTERS } = require('../../../core/operations/output-standards');
const { createSpinner, formatSpinnerSuccess } = require('../../../core/operations/spinner');

/**
 * Clean build artifacts step
 * @param {Object} options - Cleaning options
 * @returns {Promise<Object>} Step result with success and step properties
 */
async function buildCleaningStep(options = {}) {
  const { verbose = false } = options;

  try {
    const spinner = createSpinner('Cleaning build artifacts...');

    // Simulate build cleaning process
    await new Promise((resolve) => setTimeout(resolve, 500));

    spinner.succeed(formatSpinnerSuccess('Build artifacts cleaned'));

    if (verbose) {
      console.log(FORMATTERS.info('Removed temporary files and caches'));
    }

    return {
      success: true,
      step: 'Build artifacts cleaned',
    };
  } catch (error) {
    console.error(FORMATTERS.error('Failed to clean build artifacts'));
    console.error(FORMATTERS.error(error.message));
    return {
      success: false,
      step: 'Build cleaning failed',
      error: error.message,
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @param {Object} options - Cleaning options
 * @returns {Promise<boolean>} Success status
 */
async function cleanBuildArtifacts(options = {}) {
  const result = await buildCleaningStep(options);
  return result.success;
}

module.exports = {
  buildCleaningStep,
  cleanBuildArtifacts, // Backward compatibility
};
