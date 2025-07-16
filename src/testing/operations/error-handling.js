/**
 * Testing Error Handling Operations
 *
 * Mid-level business logic for standardizing error responses in testing workflows.
 * Contains operations that format consistent error responses across testing operations.
 *
 * Uses unified testing response patterns through testingCore utilities.
 */

// Import the testing core utilities
const { testingCore } = require('./formatting');

/**
 * Format testing error response
 * Business operation that creates standardized error response for testing workflows.
 * Uses unified testing response pattern through testingCore utilities.
 *
 * @param {Error} error - Error that occurred during testing
 * @param {string} testType - Type of test that failed
 * @param {string} target - Target that was being tested
 * @returns {Object} Standardized testing error response
 */
function formatTestingErrorResponse(error, testType, target) {
  return testingCore.errorResponse(error, testType, target, {
    [testType === 'performance' ? 'scenario' : testType]: target,
  });
}

/**
 * Format API testing error response
 * Business operation that creates standardized error response for API testing.
 * Uses unified testing response pattern through base formatTestingErrorResponse.
 *
 * @param {Error} error - Error that occurred during API testing
 * @param {string} endpoint - Endpoint that was being tested
 * @returns {Object} Standardized API testing error response
 */
function formatApiTestingErrorResponse(error, endpoint) {
  return formatTestingErrorResponse(error, 'api', endpoint);
}

/**
 * Format performance testing error response
 * Business operation that creates standardized error response for performance testing.
 * Uses unified testing response pattern through base formatTestingErrorResponse.
 *
 * @param {Error} error - Error that occurred during performance testing
 * @param {string} scenario - Scenario that was being tested
 * @returns {Object} Standardized performance testing error response
 */
function formatPerformanceTestingErrorResponse(error, scenario) {
  return formatTestingErrorResponse(error, 'performance', scenario);
}

/**
 * Format test orchestration error response
 * Business operation that creates standardized error response for test orchestration.
 * Uses unified testing response pattern through testingCore utilities.
 *
 * @param {Error} error - Error that occurred during orchestration
 * @param {string} command - Command that was being executed
 * @returns {Object} Standardized orchestration error response
 */
function formatOrchestrationErrorResponse(error, command) {
  return testingCore.errorResponse(error, 'orchestration', command, {
    message: `Test orchestration failed: ${error.message}`,
  });
}

module.exports = {
  formatTestingErrorResponse,
  formatApiTestingErrorResponse,
  formatPerformanceTestingErrorResponse,
  formatOrchestrationErrorResponse,
};
