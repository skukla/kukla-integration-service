/**
 * Format Domain Template Operations
 * Mid-level template operations for consistent script output patterns
 * Shared infrastructure used across all script domains
 */

const { ICONS, COLORS, templateFormatters } = require('../utils');

const { getEnvironmentIcon, capitalizeFirst, formatTargetPart, createFormattedTemplate } =
  templateFormatters;

/**
 * Generic script start message with emoji emphasis
 * @param {string} operation - Operation name (e.g., "deployment", "testing", "build")
 * @param {string} target - Target context (e.g., environment, test type)
 * @returns {string} Formatted start message
 */
function scriptStartTemplate(operation, target) {
  const targetPart = formatTargetPart(target);
  const message = `Starting ${operation}${targetPart}`;
  const capitalizedMessage = capitalizeFirst(message);
  return createFormattedTemplate(ICONS.scriptStart, capitalizedMessage, COLORS.header);
}

/**
 * Generic script completion message with emoji emphasis
 * @param {string} operation - Operation name (e.g., "deployment", "testing", "build")
 * @param {string} target - Target context (e.g., environment, test type)
 * @returns {string} Formatted completion message
 */
function scriptCompleteTemplate(operation, target) {
  const targetPart = formatTargetPart(target);
  const message = `${operation}${targetPart} completed successfully`;
  const capitalizedMessage = capitalizeFirst(message);
  return createFormattedTemplate(ICONS.scriptEnd, capitalizedMessage, COLORS.success);
}

/**
 * Format environment display
 * @param {string} env - Environment name
 * @returns {string} Formatted environment
 */
function formatEnvironment(env) {
  const envIcon = getEnvironmentIcon(env);
  return COLORS.highlight(`${env} ${envIcon}`);
}

// Build-specific templates
const buildTemplates = {
  /**
   * Format build start message
   * @returns {string} Formatted build start message
   */
  start() {
    return createFormattedTemplate(ICONS.build, 'Starting build process', COLORS.header, true);
  },

  /**
   * Format build start with emoji emphasis
   * @returns {string} Formatted build start with emoji
   */
  startEmphasis() {
    return scriptStartTemplate('build process', '');
  },

  /**
   * Format build completion message
   * @returns {string} Formatted build completion message
   */
  complete() {
    return createFormattedTemplate(
      ICONS.complete,
      'Build process completed successfully',
      COLORS.success
    );
  },
};

// Deploy-specific templates
const deployTemplates = {
  /**
   * Format deployment start message
   * @param {string} environment - Target environment
   * @returns {string} Formatted deployment start message
   */
  start(environment) {
    const envIcon = getEnvironmentIcon(environment);
    const message = `Starting deployment to ${environment} ${envIcon}`;
    return createFormattedTemplate(ICONS.deploy, message, COLORS.header, true);
  },

  /**
   * Format deployment start with emoji emphasis
   * @param {string} environment - Target environment
   * @returns {string} Formatted deployment start with emoji
   */
  startEmphasis(environment) {
    return scriptStartTemplate('deployment', environment);
  },

  /**
   * Format deployment completion message
   * @param {string} environment - Target environment
   * @returns {string} Formatted deployment completion message
   */
  complete(environment) {
    const envIcon = getEnvironmentIcon(environment);
    const message = `Deployment to ${environment} ${envIcon} completed successfully`;
    return createFormattedTemplate('', message, COLORS.success);
  },

  /**
   * Format deployment completion with emoji emphasis
   * @param {string} environment - Target environment
   * @returns {string} Formatted deployment completion with emoji
   */
  completeEmphasis(environment) {
    return scriptCompleteTemplate('deployment', environment);
  },
};

// Test-specific templates
const testTemplates = {
  /**
   * Format test start message
   * @param {string} testType - Type of test (action, api, performance)
   * @returns {string} Formatted test start message
   */
  start(testType) {
    const message = `Starting ${testType} testing`;
    return createFormattedTemplate(ICONS.test, message, COLORS.header, true);
  },

  /**
   * Format test completion message
   * @param {string} testType - Type of test (action, api, performance)
   * @returns {string} Formatted test completion message
   */
  complete(testType) {
    const message = `${testType} testing completed successfully`;
    return createFormattedTemplate('', message, COLORS.success);
  },
};

module.exports = {
  // Core template functions
  scriptStartTemplate,
  scriptCompleteTemplate,
  formatEnvironment,

  // Domain-specific templates
  build: buildTemplates,
  deploy: deployTemplates,
  test: testTemplates,
};
