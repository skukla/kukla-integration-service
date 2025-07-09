/**
 * Testing Configuration Utilities
 * Clean configuration following refactoring standards
 */

const { loadConfig } = require('../../../config');

/**
 * Get testing configuration with proper defaults
 * @param {Object} params - Action parameters
 * @returns {Object} Testing configuration
 */
function getTestingConfig(params = {}) {
  const config = loadConfig(params);
  return config.testing; // Use centralized testing domain configuration
}

module.exports = {
  getTestingConfig,
};
