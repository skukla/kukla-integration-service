/**
 * Scripts Core - Formatting Utilities
 * Simple, reusable formatting functions for consistent script output
 * Based on the clean style from the original test-action.js
 */

const chalk = require('chalk');

/**
 * Format success message with green checkmark
 * @param {string} message - Success message
 * @returns {string} Formatted success message
 */
function success(message) {
  return chalk.green(`✔ ${message}`);
}

/**
 * Format error message with red X
 * @param {string} message - Error message
 * @returns {string} Formatted error message
 */
function error(message) {
  return chalk.red(`✖ ${message}`);
}

/**
 * Format info message with blue color
 * @param {string} message - Info message
 * @returns {string} Formatted info message
 */
function info(message) {
  return chalk.blue(message);
}

/**
 * Format warning message with yellow color
 * @param {string} message - Warning message
 * @returns {string} Formatted warning message
 */
function warning(message) {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format URL with emoji and blue color
 * @param {string} url - URL to format
 * @returns {string} Formatted URL
 */
function url(url) {
  return `🔗 URL: ${chalk.blue(url)}`;
}

/**
 * Format storage info with emoji
 * @param {string} storageInfo - Storage information
 * @returns {string} Formatted storage info
 */
function storage(storageInfo) {
  return `📦 Storage: ${storageInfo}`;
}

/**
 * Format download URL with emoji and indentation
 * @param {string} downloadUrl - Download URL
 * @returns {string} Formatted download URL
 */
function downloadUrl(downloadUrl) {
  return `🔗 Download URL:\n   ${chalk.blue(downloadUrl)}`;
}

/**
 * Format status message (SUCCESS/ERROR)
 * @param {string} status - Status text
 * @param {number} code - Status code
 * @returns {string} Formatted status
 */
function status(status, code) {
  const color = code === 200 ? 'green' : 'red';
  return chalk[color](`Status: ${status.toUpperCase()} (${code})`);
}

/**
 * Format environment with appropriate capitalization
 * @param {string} env - Environment name
 * @returns {string} Formatted environment
 */
function environment(env) {
  return env.charAt(0).toUpperCase() + env.slice(1);
}

/**
 * Format numbered steps list
 * @param {Array<string>} steps - Array of step messages
 * @returns {string} Formatted steps list
 */
function steps(steps) {
  if (!steps || !Array.isArray(steps)) return '';

  return steps.map((step, index) => chalk.green(`${index + 1}. ${step}`)).join('\n');
}

/**
 * Format section header with message
 * @param {string} message - Section message
 * @returns {string} Formatted section header
 */
function section(message) {
  return chalk.white(message);
}

/**
 * Format muted text with gray color
 * @param {string} message - Text to mute
 * @returns {string} Formatted muted text
 */
function muted(message) {
  return chalk.gray(message);
}

module.exports = {
  success,
  error,
  info,
  warning,
  url,
  storage,
  downloadUrl,
  status,
  environment,
  steps,
  section,
  muted,
};
