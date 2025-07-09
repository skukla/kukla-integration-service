/**
 * Scripts Core Format Utilities
 * Shared formatting functions used by all script domains
 */

const chalk = require('chalk');

/**
 * Format success message with Unicode symbol
 * @param {string} message - Success message
 * @returns {string} Formatted message
 */
function success(message) {
  return chalk.green('✔ ' + message);
}

/**
 * Format error message with Unicode symbol
 * @param {string} message - Error message
 * @returns {string} Formatted message
 */
function error(message) {
  return chalk.red('✖ ' + message);
}

/**
 * Format warning message with Unicode symbol
 * @param {string} message - Warning message
 * @returns {string} Formatted message
 */
function warning(message) {
  return chalk.yellow('⚠ ' + message);
}

/**
 * Format info message with Unicode symbol
 * @param {string} message - Info message
 * @returns {string} Formatted message
 */
function info(message) {
  return chalk.blue('ℹ ' + message);
}

/**
 * Format header with consistent styling
 * @param {string} message - Header message
 * @returns {string} Formatted header
 */
function header(message) {
  return chalk.bold.cyan('\n' + message + '\n');
}

/**
 * Format subheader with consistent styling
 * @param {string} message - Subheader message
 * @returns {string} Formatted subheader
 */
function subheader(message) {
  return chalk.cyan(message);
}

/**
 * Format muted text
 * @param {string} message - Muted message
 * @returns {string} Formatted message
 */
function muted(message) {
  return chalk.gray(message);
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  success,
  error,
  warning,
  info,
  header,
  subheader,
  muted,
  formatFileSize,
};
