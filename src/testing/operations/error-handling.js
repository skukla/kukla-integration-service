/**
 * Testing Error Handling Operations
 *
 * Mid-level business logic for standardizing error responses in testing workflows.
 * Contains operations that format consistent error responses across testing operations.
 */

/**
 * Format testing error response
 * Business operation that creates standardized error response for testing workflows.
 *
 * @param {Error} error - Error that occurred during testing
 * @param {string} testType - Type of test that failed
 * @param {string} target - Target that was being tested
 * @returns {Object} Standardized testing error response
 */
function formatTestingErrorResponse(error, testType, target) {
  return {
    success: false,
    [testType === 'performance' ? 'scenario' : testType]: target,
    error: error.message,
    message: `${testType.charAt(0).toUpperCase() + testType.slice(1)} testing failed: ${error.message}`,
  };
}

/**
 * Format API testing error response
 * Business operation that creates standardized error response for API testing.
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
 *
 * @param {Error} error - Error that occurred during orchestration
 * @param {string} command - Command that was being executed
 * @returns {Object} Standardized orchestration error response
 */
function formatOrchestrationErrorResponse(error, command) {
  return {
    success: false,
    error: error.message,
    message: `Test orchestration failed: ${error.message}`,
    command,
  };
}

module.exports = {
  formatTestingErrorResponse,
  formatApiTestingErrorResponse,
  formatPerformanceTestingErrorResponse,
  formatOrchestrationErrorResponse,
};
