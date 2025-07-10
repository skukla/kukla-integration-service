/**
 * Scripts Core Spinner Operations
 * Shared spinner operations used across all script domains
 */

const ora = require('ora');

const { basicFormatters } = require('../utils');

/**
 * Create and start a spinner with consistent styling
 * @param {string} text - Spinner text
 * @returns {Object} Ora spinner instance
 */
function createSpinner(text) {
  return ora({
    text: basicFormatters.muted(text),
    spinner: 'dots',
  }).start();
}

/**
 * Update spinner text
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - New text
 */
function updateSpinner(spinner, text) {
  spinner.text = basicFormatters.muted(text);
}

/**
 * Stop spinner with success
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Success text
 */
function succeedSpinner(spinner, text) {
  spinner.succeed(basicFormatters.muted(text));
}

/**
 * Stop spinner with failure
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Failure text
 */
function failSpinner(spinner, text) {
  spinner.fail(basicFormatters.muted(text));
}

/**
 * Stop spinner with warning
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Warning text
 */
function warnSpinner(spinner, text) {
  spinner.warn(basicFormatters.muted(text));
}

module.exports = {
  createSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  warnSpinner,
};
