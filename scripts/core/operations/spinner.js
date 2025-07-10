/**
 * Scripts Core Spinner Operations
 * Shared spinner operations used across all script domains
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
 * Stop spinner with success
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Success text
 */
function succeedSpinner(spinner, text) {
  // Use muted formatting since ora adds its own green checkmark
  spinner.succeed(format.muted(text));
}

/**
 * Stop spinner with failure
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Failure text
 */
function failSpinner(spinner, text) {
  // Use muted formatting since ora adds its own red X
  spinner.fail(format.muted(text));
}

/**
 * Stop spinner with warning
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Warning text
 */
function warnSpinner(spinner, text) {
  // Use muted formatting since ora adds its own yellow warning
  spinner.warn(format.muted(text));
}

module.exports = {
  createSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  warnSpinner,
};
