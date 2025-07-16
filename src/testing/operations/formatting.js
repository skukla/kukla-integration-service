/**
 * Testing Formatting Operations
 * Shared response formatting logic for all testing workflows
 *
 * Testing responses are script-output-based but follow the same architectural patterns as other domains:
 * - Thin wrappers around core testing response utilities
 * - Consistent response structure across all testing operations
 * - Single source of truth for testing response formatting
 */

// Testing-specific core response utilities (specialized for script output)
const testingCore = {
  /**
   * Core testing success response builder
   * Foundation for all testing responses that indicate success.
   *
   * @param {Object} data - Test result data
   * @param {string} command - Command that was executed
   * @param {string} target - Target of the command
   * @param {string} [message] - Success message
   * @returns {Object} Core testing success response
   */
  successResponse: (data, command, target, message) => ({
    success: true,
    command,
    target,
    message: message || `${command} test completed successfully`,
    ...data,
  }),

  /**
   * Core testing error response builder
   * Foundation for all testing responses that indicate failure.
   *
   * @param {Error} error - Error that occurred
   * @param {string} command - Command that was executed
   * @param {string} target - Target of the command
   * @param {Object} [context] - Additional context
   * @returns {Object} Core testing error response
   */
  errorResponse: (error, command, target, context = {}) => ({
    success: false,
    command,
    target,
    error: error.message,
    message: `${command} test failed: ${error.message}`,
    ...context,
  }),

  /**
   * Core testing raw output response builder
   * Foundation for all testing responses that display raw output.
   *
   * @param {string} command - Command that was executed
   * @param {string} target - Target of the command
   * @returns {Object} Core testing raw output response
   */
  rawOutputResponse: (command, target) => ({
    success: true,
    command,
    target,
    rawOutput: true,
    message: `Raw ${command} test output displayed`,
  }),
};

/**
 * Handle raw output special case
 * Business operation that handles raw output display using core testing utilities.
 *
 * @param {boolean} rawOutput - Whether to show raw output
 * @param {Object} result - Test result
 * @param {string} command - Command being executed
 * @param {string} target - Target of the command
 * @returns {Object|null} Raw output response or null to continue normal processing
 */
function handleRawOutput(rawOutput, result, command, target) {
  if (rawOutput && result.rawResponse) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result.rawResponse, null, 2));
    return testingCore.rawOutputResponse(command, target);
  }
  return null;
}

/**
 * Format API testing success response
 * Business operation using core testing response utilities.
 *
 * @param {Object} result - API test result
 * @param {string} command - Command name
 * @param {string} target - Target endpoint
 * @returns {Object} Formatted response
 */
function formatApiTestingResponse(result, command, target) {
  if (result.success) {
    return testingCore.successResponse(
      {
        endpoint: result.endpoint,
        metrics: result.metrics,
      },
      command,
      target,
      result.message
    );
  } else {
    return testingCore.errorResponse(
      new Error(result.error || 'API test failed'),
      command,
      target,
      {
        endpoint: result.endpoint,
      }
    );
  }
}

/**
 * Format performance testing success response
 * Business operation using core testing response utilities.
 *
 * @param {Object} result - Performance test result
 * @param {string} command - Command name
 * @param {string} target - Target scenario
 * @returns {Object} Formatted response
 */
function formatPerformanceTestingResponse(result, command, target) {
  if (result.success) {
    return testingCore.successResponse(
      {
        scenario: result.scenario,
        type: result.type,
        metrics: result.metrics,
        analysis: result.analysis,
      },
      command,
      target,
      result.message
    );
  } else {
    return testingCore.errorResponse(
      new Error(result.error || 'Performance test failed'),
      command,
      target,
      {
        scenario: result.scenario,
        type: result.type,
      }
    );
  }
}

/**
 * Format action testing success response
 * Business operation using core testing response utilities.
 *
 * @param {Object} result - Action test result
 * @param {string} command - Command name
 * @param {string} target - Target action
 * @returns {Object} Formatted response
 */
function formatActionTestingResponse(result, command, target) {
  if (result.success) {
    return testingCore.successResponse(
      {
        actionUrl: result.actionUrl,
        environment: result.environment,
        status: result.status,
        statusText: result.statusText,
      },
      command,
      target,
      `Action ${target} tested successfully`
    );
  } else {
    return testingCore.errorResponse(
      new Error(result.error || 'Action test failed'),
      command,
      target,
      {
        actionUrl: result.actionUrl,
        environment: result.environment,
      }
    );
  }
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
  testingCore, // Export core utilities for use by error handling
};
