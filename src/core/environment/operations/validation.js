/**
 * Environment validation operations
 * @module core/environment/operations/validation
 */

/**
 * Check if current environment is staging
 * @param {Object} [params] - Action parameters
 * @returns {boolean} True if staging environment
 */
function isStaging(params = {}) {
  const { detectEnvironment } = require('./detection');
  return detectEnvironment(params) === 'staging';
}

/**
 * Check if current environment is production
 * @param {Object} [params] - Action parameters
 * @returns {boolean} True if production environment
 */
function isProduction(params = {}) {
  const { detectEnvironment } = require('./detection');
  return detectEnvironment(params) === 'production';
}

module.exports = {
  isStaging,
  isProduction,
};
