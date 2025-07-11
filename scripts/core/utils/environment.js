/**
 * Environment Detection Utility
 * Standardized environment handling for all scripts
 */

/**
 * Convert isProd boolean to environment string
 * @param {boolean} isProd - Whether in production
 * @returns {string} Environment name
 */
function getEnvironmentString(isProd = false) {
  return isProd ? 'production' : 'staging';
}

/**
 * Parse environment from CLI arguments
 * @param {Object} args - Parsed CLI arguments
 * @returns {boolean} Whether in production
 */
function parseEnvironmentFromArgs(args) {
  return args.environment === 'production';
}

/**
 * Parse environment from action parameters (legacy support)
 * @param {Object} params - Action parameters
 * @returns {boolean} Whether in production
 */
function parseEnvironmentFromParams(params) {
  return params.NODE_ENV === 'production';
}

module.exports = {
  getEnvironmentString,
  parseEnvironmentFromArgs,
  parseEnvironmentFromParams,
};
