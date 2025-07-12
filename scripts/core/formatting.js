/**
 * Scripts Core - Formatting Utilities
 * Clean, consistent formatting for script output
 * Establishes clear visual hierarchy with proper section separation
 */

const chalk = require('chalk');

/**
 * VISUAL HIERARCHY:
 * 🚀 - Major phase start (deployment, build)
 * 📦 - Section header (BUILD PHASE, DEPLOYMENT PHASE)
 * 🔧 - Action in progress (deploying, updating)
 * ✔ - Step completed successfully (green)
 * ✅ - Major phase completed (green)
 * 🎉 - Final celebration
 * ⚠ - Warning (yellow)
 * ✖ - Error (red)
 * 🔗 - URLs (blue)
 * 📦 - Storage info
 * → - Sub-information (muted, indented)
 * ⏱ - Timer/progress indicator
 */

/**
 * Format success status message with green checkmark
 * @param {string} message - Success message
 * @returns {string} Formatted success message
 */
function success(message) {
  return chalk.green(`✔ ${message}`);
}

/**
 * Format major phase completion with green checkmark emoji
 * @param {string} message - Major success message
 * @returns {string} Formatted major success message
 */
function majorSuccess(message) {
  return chalk.green(`✅ ${message}`);
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
 * Format info message with muted color
 * @param {string} message - Info message
 * @returns {string} Formatted info message
 */
function info(message) {
  return chalk.gray(message);
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
 * Format environment with appropriate capitalization
 * @param {string} env - Environment name
 * @returns {string} Formatted environment
 */
function environment(env) {
  return env.charAt(0).toUpperCase() + env.slice(1);
}

/**
 * Format status message with appropriate color
 * @param {string} status - Status text (SUCCESS/ERROR)
 * @param {number} code - HTTP status code
 * @returns {string} Formatted status message
 */
function status(status, code) {
  const color = code >= 200 && code < 300 ? 'green' : 'red';
  return chalk[color](`Status: ${status.toUpperCase()} (${code})`);
}

/**
 * Format deployment start message
 * @param {string} message - Deployment message
 * @returns {string} Formatted deployment start message
 */
function deploymentStart(message) {
  return `🚀 ${message}`;
}

/**
 * Format deployment action message
 * @param {string} message - Deployment action message
 * @returns {string} Formatted deployment action message
 */
function deploymentAction(message) {
  return `🔧 ${message}`;
}

/**
 * Format completion celebration message
 * @param {string} message - Completion message
 * @returns {string} Formatted completion message
 */
function celebration(message) {
  return `🎉 ${message}`;
}

/**
 * Format action URL with arrow prefix
 * @param {string} actionUrl - Action URL
 * @returns {string} Formatted action URL
 */
function actionUrl(actionUrl) {
  return `  -> ${chalk.blue(actionUrl)}`;
}

/**
 * Format timer message
 * @param {string} message - Timer message
 * @returns {string} Formatted timer message
 */
function timer(message) {
  return chalk.gray(`⏱ ${message}`);
}

/**
 * Format muted text with gray color
 * @param {string} message - Text to mute
 * @returns {string} Formatted muted text
 */
function muted(message) {
  return chalk.gray(message);
}

/**
 * Format section header with proper spacing and emphasis
 * @param {string} message - Section header message
 * @returns {string} Formatted section header
 */
function sectionHeader(message) {
  return chalk.bold.cyan(`📦 ${message.toUpperCase()}`);
}

/**
 * Format section message with white color
 * @param {string} message - Section message
 * @returns {string} Formatted section message
 */
function section(message) {
  return chalk.white(message);
}

/**
 * Format sub-information with indentation and muted color
 * @param {string} message - Sub-information message
 * @returns {string} Formatted sub-information
 */
function subInfo(message) {
  return chalk.gray(`   → ${message}`);
}

/**
 * Format in-place progress message
 * @param {string} message - Progress message
 * @returns {string} Formatted progress message
 */
function progress(message) {
  return chalk.blue(`⏱ ${message}`);
}

/**
 * Add proper spacing between sections
 * @returns {string} Section separator
 */
function sectionSeparator() {
  return '\n';
}

/**
 * Sleep utility for better flow timing
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  success,
  majorSuccess,
  error,
  info,
  warning,
  url,
  storage,
  environment,
  status,
  deploymentStart,
  deploymentAction,
  celebration,
  actionUrl,
  timer,
  muted,
  section,
  sectionHeader,
  subInfo,
  progress,
  sectionSeparator,
  sleep,
};
