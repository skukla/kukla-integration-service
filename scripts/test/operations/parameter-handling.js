/**
 * Test Domain - Parameter Handling Operations
 * Operations for filtering and processing action parameters
 */

const { parameters } = require('../../core/utils');

/**
 * Filter action parameters for Adobe I/O Runtime
 * Removes system/reserved properties that shouldn't be sent to actions
 * @param {Object} params - Raw parameters object
 * @returns {Object} Filtered parameters safe for action execution
 */
function filterActionParameters(params) {
  return parameters.filterActionParameters(params);
}

/**
 * Extract test-specific parameters from action parameters
 * @param {Object} params - Action parameters
 * @returns {Object} Test-specific parameters
 */
function extractTestParameters(params) {
  const testKeys = ['DEBUG', 'VERBOSE', 'TIMEOUT'];
  return parameters.extractParameters(params, testKeys);
}

module.exports = {
  filterActionParameters,
  extractTestParameters,
};
