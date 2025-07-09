/**
 * Scripts Core Spinner Operations
 * Shared spinner functionality used by all script domains
 */

const ora = require('ora');

const { format } = require('../utils');

/**
 * Create a spinner with consistent styling
 * @param {string} text - Spinner text
 * @param {Object} options - Spinner options
 * @param {string} options.color - Spinner color (default: 'cyan')
 * @returns {Object} Ora spinner instance
 */
function createSpinner(text, options = {}) {
  const { color = 'cyan' } = options;

  return ora({
    text,
    color,
    spinner: 'dots',
  });
}

/**
 * Format spinner success message
 * @param {string} message - Success message
 * @returns {string} Formatted message
 */
function formatSpinnerSuccess(message) {
  return format.formatSuccess(message);
}

module.exports = {
  createSpinner,
  formatSpinnerSuccess,
};
