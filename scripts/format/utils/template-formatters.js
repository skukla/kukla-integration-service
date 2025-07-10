/**
 * Format Domain Template Formatters
 * Pure utility functions for template formatting
 * Low-level utilities with no business logic - belongs in utils layer
 * Shared infrastructure used across all script domains
 */

const { ICONS, SPACING } = require('./constants');

/**
 * Get environment icon based on environment name
 * Pure utility function - no business logic
 * @param {string} environment - Environment name
 * @returns {string} Environment icon
 */
function getEnvironmentIcon(environment) {
  return environment === 'production' ? ICONS.production : ICONS.staging;
}

/**
 * Capitalize first letter of string
 * Pure utility function - no business logic
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/**
 * Format target part for messages
 * Pure utility function - no business logic
 * @param {string} target - Target context
 * @returns {string} Formatted target part
 */
function formatTargetPart(target) {
  const capitalizedTarget = capitalizeFirst(target);
  return target ? ` for ${capitalizedTarget}` : '';
}

/**
 * Create formatted template with consistent spacing and structure
 * Pure utility function - no business logic
 * @param {string} icon - Icon to use
 * @param {string} message - Message content
 * @param {Function} colorFunc - Color function (COLORS.header, COLORS.success, etc.)
 * @param {boolean} includeEllipsis - Whether to include ellipsis
 * @returns {string} Formatted template
 */
function createFormattedTemplate(icon, message, colorFunc, includeEllipsis = false) {
  const ellipsis = includeEllipsis ? '...' : '';
  return colorFunc(`${SPACING.beforeSection}${icon} ${message}${ellipsis}${SPACING.afterSection}`);
}

module.exports = {
  getEnvironmentIcon,
  capitalizeFirst,
  formatTargetPart,
  createFormattedTemplate,
};
