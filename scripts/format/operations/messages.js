/**
 * Format Domain Message Operations
 * Mid-level message formatting operations for consistent output
 * Shared infrastructure used across all script domains
 *
 * CONSOLIDATED: Merged from core/operations/formatting.js and mesh-templates.js
 * ENHANCED: Complete set of message formatting operations
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
 * Format subsection header with lighter styling
 * ENHANCED: Supports optional icon parameter for consistency
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
 * CONSOLIDATED: From core/operations/formatting.js
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
 * CONSOLIDATED: From core/operations/formatting.js
 * @param {string} text - Script completion text
 * @returns {string} Formatted script end
 */
function scriptEnd(text) {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} ${text}${SPACING.afterSection}`
  );
}

/**
 * Format mesh update start message
 * CONSOLIDATED: From core/operations/mesh-templates.js
 * @returns {string} Formatted mesh update start message
 */
function meshUpdateStart() {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.mesh} Starting API Mesh update...${SPACING.afterSection}`
  );
}

/**
 * Format mesh polling start message
 * CONSOLIDATED: From core/operations/mesh-templates.js
 * @param {number} interval - Polling interval in seconds
 * @param {number} maxChecks - Maximum number of checks
 * @returns {string} Formatted mesh polling start message
 */
function meshPollingStart(interval, maxChecks) {
  const maxTime = Math.ceil((interval * maxChecks) / 60);
  return COLORS.info(
    `${SPACING.indent}Polling mesh status every ${interval}s (max ${maxTime} minutes)...`
  );
}

/**
 * Format mesh start with emoji emphasis
 * CONSOLIDATED: From core/operations/mesh-templates.js
 * @param {string} environment - Target environment
 * @returns {string} Formatted mesh start with emoji
 */
function meshStartEmphasis(environment) {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.scriptStart} Starting mesh update for ${environment}${SPACING.afterSection}`
  );
}

/**
 * Format mesh completion with emoji emphasis
 * CONSOLIDATED: From core/operations/mesh-templates.js
 * @param {string} environment - Target environment
 * @returns {string} Formatted mesh completion with emoji
 */
function meshCompleteEmphasis(environment) {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} Mesh update for ${environment} completed successfully${SPACING.afterSection}`
  );
}

module.exports = {
  sectionHeader,
  subsectionHeader,
  completion,
  finalSuccess,
  scriptStart,
  scriptEnd,
  meshUpdateStart,
  meshPollingStart,
  meshStartEmphasis,
  meshCompleteEmphasis,
};
