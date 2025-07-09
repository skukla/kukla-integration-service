/**
 * Core Mesh Output Templates
 * Mid-level operations for mesh-specific message formatting
 * Belongs in core operations since mesh is shared infrastructure
 */

const { ICONS, COLORS, SPACING } = require('../utils/output-constants');

/**
 * Format mesh update start message
 * @returns {string} Formatted mesh update start message
 */
function meshUpdateStart() {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.mesh} Starting API Mesh update...${SPACING.afterSection}`
  );
}

/**
 * Format mesh polling start message
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
 * @param {string} environment - Target environment
 * @returns {string} Formatted mesh completion with emoji
 */
function meshCompleteEmphasis(environment) {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} Mesh update for ${environment} completed successfully${SPACING.afterSection}`
  );
}

module.exports = {
  meshUpdateStart,
  meshPollingStart,
  meshStartEmphasis,
  meshCompleteEmphasis,
};
