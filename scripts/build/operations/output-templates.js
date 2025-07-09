/**
 * Build Domain Output Templates
 * Mid-level operations for build-specific message formatting
 * Belongs in build domain operations layer
 */

const { ICONS, COLORS, SPACING } = require('../../core/utils/output-constants');

/**
 * Format build start message
 * @returns {string} Formatted build start message
 */
function buildStart() {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.build} Starting build process...${SPACING.afterSection}`
  );
}

/**
 * Format build start with emoji emphasis
 * @returns {string} Formatted build start with emoji
 */
function buildStartEmphasis() {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.scriptStart} Starting build process${SPACING.afterSection}`
  );
}

/**
 * Format build completion message
 * @returns {string} Formatted build completion message
 */
function buildComplete() {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.complete} Build process completed successfully${SPACING.afterSection}`
  );
}

module.exports = {
  buildStart,
  buildStartEmphasis,
  buildComplete,
}; 
