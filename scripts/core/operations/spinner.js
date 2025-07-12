/**
 * Scripts Core Spinner Operations
 * Consistent spinner → success/failure pattern with proper formatting
 */

const ora = require('ora');

const format = require('../formatting');

/**
 * Create and start a spinner with consistent styling
 * @param {string} text - Spinner text
 * @returns {Object} Ora spinner instance
 */
function createSpinner(text) {
  return ora({
    text: format.muted(text),
    spinner: 'dots',
  }).start();
}

/**
 * Update spinner text
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - New text
 */
function updateSpinner(spinner, text) {
  spinner.text = format.muted(text);
}

/**
 * Stop spinner with success using our green checkmark format
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Success text
 */
function succeedSpinner(spinner, text) {
  spinner.stop();
  console.log(format.success(text));
}

/**
 * Stop spinner with failure using our red X format
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Failure text
 */
function failSpinner(spinner, text) {
  spinner.stop();
  console.log(format.error(text));
}

/**
 * Stop spinner with warning using our yellow warning format
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Warning text
 */
function warnSpinner(spinner, text) {
  spinner.stop();
  console.log(format.warning(text));
}

/**
 * Create a spinner, run an async function, then succeed/fail based on result
 * @param {string} spinnerText - Text to show while spinning
 * @param {string} successText - Text to show on success
 * @param {Function} asyncFn - Async function to execute
 * @returns {Promise} Result of the async function
 */
async function withSpinner(spinnerText, successText, asyncFn) {
  const spinner = createSpinner(spinnerText);

  try {
    const result = await asyncFn();
    succeedSpinner(spinner, successText);
    return result;
  } catch (error) {
    failSpinner(spinner, `Failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  warnSpinner,
  withSpinner,
};
