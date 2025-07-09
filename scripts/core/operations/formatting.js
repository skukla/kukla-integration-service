/**
 * Scripts Core Formatting Operations
 * Mid-level shared formatting operations for consistent output
 * Contains only cross-domain formatting logic
 */

const { basicFormatters } = require('../utils');
const { ICONS, COLORS, SPACING } = require('../utils/output-constants');

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
 * Format subsection header with lighter styling
 * @param {string} text - Subheader text
 * @param {string} icon - Optional icon
 * @returns {string} Formatted subheader
 */
function subsectionHeader(text, icon = '') {
  const iconPart = icon ? `${icon} ` : '';
  return COLORS.subheader(`${iconPart}${text}`);
}

/**
 * Format completion message
 * @param {string} text - Completion message
 * @returns {string} Formatted completion message
 */
function completion(text) {
  return COLORS.success(`${SPACING.beforeSection}${ICONS.complete} ${text}${SPACING.afterSection}`);
}

/**
 * Format final success message with emphasis
 * @param {string} text - Success message
 * @returns {string} Formatted final success message
 */
function finalSuccess(text) {
  return COLORS.success(`${SPACING.beforeSection}${ICONS.complete} ${text}${SPACING.afterSection}`);
}

/**
 * Format script start with emoji emphasis
 * @param {string} text - Script start text
 * @returns {string} Formatted script start
 */
function scriptStart(text) {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.scriptStart} ${text}${SPACING.afterSection}`
  );
}

/**
 * Format script end with emoji emphasis
 * @param {string} text - Script completion text
 * @returns {string} Formatted script end
 */
function scriptEnd(text) {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} ${text}${SPACING.afterSection}`
  );
}

// Re-export basic formatters for convenience
const { success, error, warning, info, progress, step, text, muted, bold, highlight, url } =
  basicFormatters;

module.exports = {
  // Core formatting operations
  sectionHeader,
  subsectionHeader,
  completion,
  finalSuccess,
  scriptStart,
  scriptEnd,

  // Re-exported basic formatters
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
