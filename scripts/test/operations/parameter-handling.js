/**
 * Test Domain - Parameter Handling Operations
 * Operations for filtering and processing action parameters
 */

const {
  filterActionParameters: filterParams,
  extractParameters: extractParams,
} = require('../../core/utils/parameters');

/**
 * Filter action parameters to remove test-specific keys
 * @param {Object} params - Raw parameters object
 * @returns {Object} Filtered parameters safe for action execution
 */
function filterActionParameters(params) {
  return filterParams(params);
}

/**
 * Extract test-specific parameters
 * @param {Object} params - Raw parameters object
 * @returns {Object} Test-specific parameters
 */
function extractTestParameters(params) {
  const testKeys = ['DEBUG', 'VERBOSE', 'TIMEOUT'];
  return extractParams(params, testKeys);
}

module.exports = {
  filterActionParameters,
  extractTestParameters,
};
