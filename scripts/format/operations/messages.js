/**
 * Format Domain Message Operations
 * Mid-level message formatting operations for consistent output
 * Shared infrastructure used across all script domains
 */

const { ICONS, COLORS, SPACING } = require('../utils');

/**
 * Format section header
 * @param {string} text - Header text
 * @param {string} icon - Optional icon
 * @returns {string} Formatted header
 */
function sectionHeader(text, icon = '') {
  const iconPart = icon ? `${icon} ` : '';
  return COLORS.header(`${SPACING.beforeSection}${iconPart}${text}...${SPACING.afterSection}`);
}

/**
 * Format subsection header
 * @param {string} text - Subsection text
 * @returns {string} Formatted subsection header
 */
function subsectionHeader(text) {
  return COLORS.subheader(`${SPACING.indent}${text}:`);
}

/**
 * Format completion message
 * @param {string} text - Completion message
 * @returns {string} Formatted completion message
 */
function completion(text) {
  return COLORS.success(`${SPACING.beforeSection}${text}${SPACING.afterSection}`);
}

/**
 * Format final success message with emphasis
 * @param {string} text - Final success message
 * @returns {string} Formatted final success message
 */
function finalSuccess(text) {
  return COLORS.success(`${SPACING.beforeSection}${ICONS.complete} ${text}${SPACING.afterSection}`);
}

module.exports = {
  sectionHeader,
  subsectionHeader,
  completion,
  finalSuccess,
};
