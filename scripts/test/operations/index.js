/**
 * Test Domain Operations
 * Business operations specific to testing processes
 *
 * Following Strategic Duplication approach - domain-specific utilities
 * for test URL building and response handling.
 */

const testExecution = require('./test-execution');
// Domain-specific utilities (strategic duplication for test clarity)
const { loadConfig } = require('../../../config');
const { buildRuntimeUrl } = require('../../../src/core/routing');

/**
 * Filter action parameters for Adobe I/O Runtime
 * Removes system/reserved properties that shouldn't be sent to actions
 * @param {Object} params - Raw parameters object
 * @returns {Object} Filtered parameters safe for action execution
 */
function filterActionParameters(params) {
  return Object.keys(params)
    .filter((key) => {
      // Filter out Adobe I/O system variables
      if (key.startsWith('AIO_')) return false;

      // Filter out other reserved properties
      const reservedProperties = ['NODE_ENV', 'SERVICE_API_KEY'];
      if (reservedProperties.includes(key)) return false;

      return true;
    })
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});
}

/**
 * Build Adobe I/O Runtime action URL for testing
 * Domain-specific version with test-focused error handling
 * @param {string} actionName - Name of action
 * @param {Object} params - Action parameters
 * @returns {string} Built action URL
 */
function buildActionUrl(actionName, params) {
  const config = loadConfig(params);
  return buildRuntimeUrl(actionName, null, config);
}

/**
 * Determine if HTTP response indicates success for testing
 * Domain-specific version with test-focused success criteria
 * @param {Object} response - HTTP response object
 * @returns {boolean} True if successful response
 */
function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
}

// parseActionResponseBody and extractStorageInfo moved inline to workflows
// These were simple 6-10 line functions that didn't warrant separate abstractions

module.exports = {
  testExecution,

  // Parameter and response handling operations
  filterActionParameters,

  // Domain-specific utilities (strategic duplication for test clarity)
  buildActionUrl,
  isSuccessfulResponse,
};
