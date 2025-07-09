/**
 * Testing Formatting Operations
 * Shared response formatting logic for all testing workflows
 */

/**
 * Handle raw output special case
 * @param {boolean} rawOutput - Whether to show raw output
 * @param {Object} result - Test result
 * @param {string} command - Command being executed
 * @param {string} target - Target of the command
 * @returns {Object|null} Raw output response or null to continue normal processing
 */
function handleRawOutput(rawOutput, result, command, target) {
  if (rawOutput && result.rawResponse) {
    console.log(JSON.stringify(result.rawResponse, null, 2));
    return {
      success: true,
      command,
      target,
      rawOutput: true,
      message: `Raw ${command} test output displayed`,
    };
  }
  return null;
}

/**
 * Format API testing success response
 * @param {Object} result - API test result
 * @param {string} command - Command name
 * @param {string} target - Target endpoint
 * @returns {Object} Formatted response
 */
function formatApiTestingResponse(result, command, target) {
  return {
    success: result.success,
    command,
    target,
    endpoint: result.endpoint,
    metrics: result.metrics,
    error: result.error,
    message: result.message,
  };
}

/**
 * Format performance testing success response
 * @param {Object} result - Performance test result
 * @param {string} command - Command name
 * @param {string} target - Target scenario
 * @returns {Object} Formatted response
 */
function formatPerformanceTestingResponse(result, command, target) {
  return {
    success: result.success,
    command,
    target,
    scenario: result.scenario,
    type: result.type,
    metrics: result.metrics,
    analysis: result.analysis,
    error: result.error,
    message: result.message,
  };
}

/**
 * Format action testing success response
 * @param {Object} result - Action test result
 * @param {string} command - Command name
 * @param {string} target - Target action
 * @returns {Object} Formatted response
 */
function formatActionTestingResponse(result, command, target) {
  return {
    success: result.success,
    command,
    target,
    actionUrl: result.actionUrl,
    environment: result.environment,
    status: result.status,
    statusText: result.statusText,
    message: `Action ${target} tested successfully`,
  };
}

/**
 * Format test success response
 * @param {Object} result - Test result
 * @param {string} testType - Type of test ('api', 'performance', 'action')
 * @param {string} command - Command name
 * @param {string} target - Target of the test
 * @returns {Object} Formatted response
 */
function formatTestResponse(result, testType, command, target) {
  switch (testType) {
    case 'api':
      return formatApiTestingResponse(result, command, target);
    case 'performance':
      return formatPerformanceTestingResponse(result, command, target);
    case 'action':
      return formatActionTestingResponse(result, command, target);
    default:
      return {
        success: result.success,
        command,
        target,
        error: result.error,
        message: result.message,
      };
  }
}

module.exports = {
  handleRawOutput,
  formatApiTestingResponse,
  formatPerformanceTestingResponse,
  formatActionTestingResponse,
  formatTestResponse,
};
