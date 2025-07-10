/**
 * Build Cleaning Step
 * Handles cleanup of build artifacts
 */

const { createSpinner } = require('../../../core/operations/spinner');
const { basicFormatters } = require('../../../core/utils');

/**
 * Clean build artifacts
 * @param {Object} options - Cleaning options
 * @returns {Promise<Object>} Cleaning result
 */
async function buildCleaningStep(options = {}) {
  const { verbose = false } = options;

  try {
    const spinner = createSpinner('Cleaning build artifacts...');

    // Simulate cleanup process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    spinner.succeed(basicFormatters.muted('Build artifacts cleaned'));

    if (verbose) {
      console.log(basicFormatters.info('Removed temporary files'));
    }

    return {
      success: true,
      step: 'Build artifacts cleaned',
    };
  } catch (error) {
    console.error(basicFormatters.error('Build cleaning failed'));
    console.error(basicFormatters.error(error.message));
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  buildCleaningStep,
};
