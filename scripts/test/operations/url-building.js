/**
 * Test Domain - URL Building Operations
 * Test-specific URL utilities that delegate to shared infrastructure
 */

const { buildActionUrl: sharedBuildActionUrl } = require('../../core/operations/url-building');

/**
 * Build Adobe I/O Runtime action URL for testing
 * @param {string} actionName - Name of action
 * @param {Object} params - Action parameters
 * @param {boolean} isProd - Whether building for production (defaults to false for testing)
 * @returns {string} Built action URL
 */
function buildActionUrl(actionName, params, isProd = false) {
  return sharedBuildActionUrl(actionName, params, isProd);
}

module.exports = {
  buildActionUrl,
};
