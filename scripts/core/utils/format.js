/**
 * Scripts Core Format Utilities
 * Shared formatting functions used by all script domains
 */

const chalk = require('chalk');

/**
 * Format success message
 * @param {string} message - Success message
 * @returns {string} Formatted message
 */
function formatSuccess(message) {
  return chalk.green('✅ ' + message);
}

/**
 * Format error message
 * @param {string} message - Error message
 * @returns {string} Formatted message
 */
function formatError(message) {
  return chalk.red('❌ ' + message);
}

/**
 * Format warning message
 * @param {string} message - Warning message
 * @returns {string} Formatted message
 */
function formatWarning(message) {
  return chalk.yellow('⚠️ ' + message);
}

/**
 * Format info message
 * @param {string} message - Info message
 * @returns {string} Formatted message
 */
function formatInfo(message) {
  return chalk.blue('ℹ️ ' + message);
}

/**
 * Format bold text
 * @param {string} text - Text to make bold
 * @returns {string} Formatted text
 */
function formatBold(text) {
  return chalk.bold(text);
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
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatBold,
  formatFileSize,
};
