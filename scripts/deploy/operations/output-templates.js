/**
 * Deploy Domain Output Templates
 * Mid-level operations for deployment-specific message formatting
 * Belongs in deploy domain operations layer
 */

const { basicFormatters } = require('../../core/utils');
const { ICONS, COLORS, SPACING } = require('../../core/utils/output-constants');

/**
 * Format deployment start message
 * @param {string} environment - Target environment
 * @returns {string} Formatted deployment start message
 */
function deploymentStart(environment) {
  const envIcon = environment === 'production' ? ICONS.production : ICONS.staging;
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.deploy} Starting deployment to ${environment} ${envIcon}...${SPACING.afterSection}`
  );
}

/**
 * Format deployment start with emoji emphasis
 * @param {string} environment - Target environment
 * @returns {string} Formatted deployment start with emoji
 */
function deploymentStartEmphasis(environment) {
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.scriptStart} Starting deployment to ${environment}${SPACING.afterSection}`
  );
}

/**
 * Format deployment completion message
 * @param {string} environment - Target environment
 * @returns {string} Formatted deployment completion message
 */
function deploymentComplete(environment) {
  const envIcon = environment === 'production' ? ICONS.production : ICONS.staging;
  return basicFormatters.success(
    `${SPACING.beforeSection}Deployment to ${environment} ${envIcon} completed successfully${SPACING.afterSection}`
  );
}

/**
 * Format deployment completion with emoji emphasis
 * @param {string} environment - Target environment
 * @returns {string} Formatted deployment completion with emoji
 */
function deploymentCompleteEmphasis(environment) {
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} Deployment to ${environment} completed successfully${SPACING.afterSection}`
  );
}

/**
 * Format environment display
 * @param {string} env - Environment name
 * @returns {string} Formatted environment
 */
function environment(env) {
  const envIcon = env === 'production' ? ICONS.production : ICONS.staging;
  return COLORS.highlight(`${env} ${envIcon}`);
}

/**
 * Generic script start message with emoji emphasis
 * @param {string} operation - Operation name (e.g., "deployment", "testing", "build")
 * @param {string} target - Target context (e.g., environment, test type)
 * @returns {string} Formatted start message
 */
function scriptStartEmphasis(operation, target) {
  const capitalizedTarget = target.charAt(0).toUpperCase() + target.slice(1);
  const message = `Starting ${operation} for ${capitalizedTarget}`;
  const capitalizedMessage = message.charAt(0).toUpperCase() + message.slice(1);
  return COLORS.header(
    `${SPACING.beforeSection}${ICONS.scriptStart} ${capitalizedMessage}${SPACING.afterSection}`
  );
}

/**
 * Generic script completion message with emoji emphasis
 * @param {string} operation - Operation name (e.g., "deployment", "testing", "build")
 * @param {string} target - Target context (e.g., environment, test type)
 * @returns {string} Formatted completion message
 */
function scriptCompleteEmphasis(operation, target) {
  const capitalizedTarget = target.charAt(0).toUpperCase() + target.slice(1);
  const message = `${operation} for ${capitalizedTarget} completed successfully`;
  const capitalizedMessage = message.charAt(0).toUpperCase() + message.slice(1);
  return COLORS.success(
    `${SPACING.beforeSection}${ICONS.scriptEnd} ${capitalizedMessage}${SPACING.afterSection}`
  );
}

module.exports = {
  deploymentStart,
  deploymentStartEmphasis,
  deploymentComplete,
  deploymentCompleteEmphasis,
  environment,
  scriptStartEmphasis,
  scriptCompleteEmphasis,
};
