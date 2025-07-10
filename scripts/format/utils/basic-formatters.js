/**
 * Format Domain Basic Formatters
 * Low-level formatting utilities for consistent message output
 * Pure formatting functions with no business logic - belongs in utils layer
 * Shared infrastructure used across all script domains
 */

const { ICONS, COLORS, SPACING } = require('./constants');

/**
 * Format success message
 * @param {string} text - Success message
 * @returns {string} Formatted success message
 */
function success(text) {
  return COLORS.success(`${ICONS.success} ${text}`);
}

/**
 * Format error message
 * @param {string} text - Error message
 * @returns {string} Formatted error message
 */
function error(text) {
  return COLORS.error(`${ICONS.error} ${text}`);
}

/**
 * Format warning message
 * @param {string} text - Warning message
 * @returns {string} Formatted warning message
 */
function warning(text) {
  return COLORS.warning(`${ICONS.warning} ${text}`);
}

/**
 * Format info message
 * @param {string} text - Info message
 * @returns {string} Formatted info message
 */
function info(text) {
  return COLORS.info(`${ICONS.info} ${text}`);
}

/**
 * Format progress message
 * @param {string} text - Progress message
 * @returns {string} Formatted progress message
 */
function progress(text) {
  return COLORS.info(`${ICONS.progress} ${text}`);
}

/**
 * Format step message
 * @param {string} text - Step message
 * @returns {string} Formatted step message
 */
function step(text) {
  return COLORS.info(`${SPACING.indent}${text}`);
}

/**
 * Format normal text
 * @param {string} text - Normal text
 * @returns {string} Formatted normal text
 */
function text(text) {
  return COLORS.normal(text);
}

/**
 * Format muted text
 * @param {string} text - Muted text
 * @returns {string} Formatted muted text
 */
function muted(text) {
  return COLORS.muted(text);
}

/**
 * Format bold text
 * @param {string} text - Bold text
 * @returns {string} Formatted bold text
 */
function bold(text) {
  return COLORS.bold(text);
}

/**
 * Format highlighted text
 * @param {string} text - Highlighted text
 * @returns {string} Formatted highlighted text
 */
function highlight(text) {
  return COLORS.highlight(text);
}

/**
 * Format URL
 * @param {string} text - URL text
 * @returns {string} Formatted URL
 */
function url(text) {
  return COLORS.url(text);
}

module.exports = {
  success,
  error,
  warning,
  info,
  progress,
  step,
  text,
  muted,
  bold,
  highlight,
  url,
};
