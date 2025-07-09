/**
 * Scripts Core Basic Formatters
 * Low-level formatting utilities for consistent message output
 * Pure formatting functions with no business logic - belongs in utils layer
 */

const { ICONS, COLORS, SPACING } = require('./output-constants');

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
 * Format progress message (for status updates)
 * @param {string} text - Progress message
 * @param {number} current - Current step (optional)
 * @param {number} total - Total steps (optional)
 * @returns {string} Formatted progress message
 */
function progress(text, current = null, total = null) {
  const progressPart = current && total ? ` (${current}/${total})` : '';
  return COLORS.muted(`${SPACING.indent}${text}${progressPart}`);
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
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
function text(text) {
  return COLORS.normal(text);
}

/**
 * Format muted text
 * @param {string} text - Text to format
 * @returns {string} Formatted muted text
 */
function muted(text) {
  return COLORS.muted(text);
}

/**
 * Format bold text
 * @param {string} text - Text to format
 * @returns {string} Formatted bold text
 */
function bold(text) {
  return COLORS.bold(text);
}

/**
 * Format highlighted text
 * @param {string} text - Text to format
 * @returns {string} Formatted highlighted text
 */
function highlight(text) {
  return COLORS.highlight(text);
}

/**
 * Format URL
 * @param {string} url - URL to format
 * @param {string} label - Optional label (default: url)
 * @returns {string} Formatted URL
 */
function url(url, label = null) {
  const displayText = label || url;
  return COLORS.url(displayText);
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
