/**
 * Testing Domain Errors
 * Domain-specific error handling for testing capabilities
 */

// Error Creation Utilities

/**
 * Create base testing error
 * @purpose Create standardized testing error with context
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} context - Additional error context
 * @returns {Error} Testing error instance
 * @usedBy All testing error creation functions
 */
function createTestingError(message, code = 'TESTING_ERROR', context = {}) {
  const error = new Error(message);
  error.name = 'TestingError';
  error.code = code;
  error.context = context;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Create action test error with context
 * @purpose Create standardized action test error
 * @param {string} message - Error message
 * @param {string} actionName - Name of action that failed
 * @param {Object} context - Additional error context
 * @returns {Error} Action test error instance
 * @usedBy Action testing features for error creation
 */
function createActionTestError(message, actionName, context = {}) {
  const error = createTestingError(message, 'ACTION_TEST_ERROR', { ...context, actionName });
  error.name = 'ActionTestError';
  error.actionName = actionName;
  return error;
}

/**
 * Create API test error with context
 * @purpose Create standardized API test error
 * @param {string} message - Error message
 * @param {string} endpoint - API endpoint that failed
 * @param {Object} context - Additional error context
 * @returns {Error} API test error instance
 * @usedBy API testing features for error creation
 */
function createApiTestError(message, endpoint, context = {}) {
  const error = createTestingError(message, 'API_TEST_ERROR', { ...context, endpoint });
  error.name = 'ApiTestError';
  error.endpoint = endpoint;
  return error;
}

/**
 * Create performance test error with context
 * @purpose Create standardized performance test error
 * @param {string} message - Error message
 * @param {string} target - Performance test target that failed
 * @param {Object} context - Additional error context
 * @returns {Error} Performance test error instance
 * @usedBy Performance testing features for error creation
 */
function createPerformanceTestError(message, target, context = {}) {
  const error = createTestingError(message, 'PERFORMANCE_TEST_ERROR', { ...context, target });
  error.name = 'PerformanceTestError';
  error.target = target;
  return error;
}

/**
 * Create test orchestration error with context
 * @purpose Create standardized test orchestration error
 * @param {string} message - Error message
 * @param {string} suite - Test suite that failed
 * @param {Object} context - Additional error context
 * @returns {Error} Test orchestration error instance
 * @usedBy Test orchestration features for error creation
 */
function createTestOrchestrationError(message, suite, context = {}) {
  const error = createTestingError(message, 'TEST_ORCHESTRATION_ERROR', { ...context, suite });
  error.name = 'TestOrchestrationError';
  error.suite = suite;
  return error;
}

// Error Analysis Utilities

/**
 * Analyze error for testing context
 * @purpose Extract useful information from errors for testing purposes
 * @param {Error} error - Error to analyze
 * @returns {Object} Error analysis with categorization and suggestions
 * @usedBy All testing features for error analysis
 */
function analyzeTestingError(error) {
  const analysis = {
    type: 'unknown',
    category: 'general',
    severity: 'medium',
    suggestions: [],
    retryable: false,
  };

  // Determine error type and category
  determineErrorTypeAndCategory(error, analysis);

  // Determine if error is retryable
  determineErrorRetryability(error, analysis);

  // Determine severity and suggestions
  determineErrorSeverityAndSuggestions(error, analysis);

  return analysis;
}

/**
 * Determine error type and category based on error name
 * @purpose Classify error by type and category for analysis
 * @param {Error} error - Error to classify
 * @param {Object} analysis - Analysis object to update
 */
function determineErrorTypeAndCategory(error, analysis) {
  if (error.name === 'ActionTestError') {
    analysis.type = 'action_test';
    analysis.category = 'action_execution';
  } else if (error.name === 'ApiTestError') {
    analysis.type = 'api_test';
    analysis.category = 'api_communication';
  } else if (error.name === 'PerformanceTestError') {
    analysis.type = 'performance_test';
    analysis.category = 'performance_measurement';
  } else if (error.name === 'TestOrchestrationError') {
    analysis.type = 'test_orchestration';
    analysis.category = 'test_coordination';
  }
}

/**
 * Determine if error is retryable based on content
 * @purpose Check if error conditions suggest retry might succeed
 * @param {Error} error - Error to check
 * @param {Object} analysis - Analysis object to update
 */
function determineErrorRetryability(error, analysis) {
  const isNetworkError =
    error.message.includes('timeout') ||
    error.message.includes('network') ||
    error.message.includes('connection');

  analysis.retryable = isNetworkError && analysis.type !== 'performance_test';
}

/**
 * Determine error severity and provide suggestions
 * @purpose Assess error severity and recommend actions
 * @param {Error} error - Error to assess
 * @param {Object} analysis - Analysis object to update
 */
function determineErrorSeverityAndSuggestions(error, analysis) {
  const isNetworkError =
    error.message.includes('timeout') ||
    error.message.includes('network') ||
    error.message.includes('connection');
  const isValidationError =
    error.message.includes('validation') || error.message.includes('assertion');
  const isConfigurationError =
    error.message.includes('configuration') || error.message.includes('setup');

  if (isNetworkError) {
    analysis.severity = 'low';
    analysis.suggestions.push('Consider increasing timeout or checking network connectivity');
  } else if (isValidationError) {
    analysis.severity = 'high';
    analysis.suggestions.push('Review test expectations and response format');
  } else if (isConfigurationError) {
    analysis.severity = 'high';
    analysis.suggestions.push('Check test configuration and environment setup');
  }
}

/**
 * Check if error is retryable
 * @purpose Determine if a failed test should be retried
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 * @usedBy Test orchestration for retry logic
 */
function isRetryableError(error) {
  const analysis = analyzeTestingError(error);
  return analysis.retryable;
}

// Error Formatting Utilities

/**
 * Format testing error for display
 * @purpose Create human-readable error messages for testing contexts
 * @param {Error} error - Error to format
 * @param {boolean} includeContext - Whether to include error context
 * @returns {string} Formatted error message
 * @usedBy All testing features for error display
 */
function formatTestingError(error, includeContext = true) {
  let formatted = `${error.name}: ${error.message}`;

  if (error.name === 'ActionTestError') {
    formatted = `Action Test Failed (${error.actionName}): ${error.message}`;
  } else if (error.name === 'ApiTestError') {
    formatted = `API Test Failed (${error.endpoint}): ${error.message}`;
  } else if (error.name === 'PerformanceTestError') {
    formatted = `Performance Test Failed (${error.target}): ${error.message}`;
  } else if (error.name === 'TestOrchestrationError') {
    formatted = `Test Suite Failed (${error.suite}): ${error.message}`;
  }

  if (includeContext && error.context) {
    const contextInfo = Object.entries(error.context)
      .filter(([key]) => !['actionName', 'endpoint', 'target', 'suite'].includes(key))
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    if (contextInfo) {
      formatted += ` (${contextInfo})`;
    }
  }

  return formatted;
}

/**
 * Extract error summary for reporting
 * @purpose Create concise error summary for test reports
 * @param {Error} error - Error to summarize
 * @returns {Object} Error summary object
 * @usedBy Test reporting features for error summaries
 */
function extractErrorSummary(error) {
  const analysis = analyzeTestingError(error);

  return {
    type: analysis.type,
    category: analysis.category,
    severity: analysis.severity,
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    retryable: analysis.retryable,
    suggestions: analysis.suggestions,
    context: error.context || {},
  };
}

module.exports = {
  // Error creation utilities (pure functions)
  createTestingError,
  createActionTestError,
  createApiTestError,
  createPerformanceTestError,
  createTestOrchestrationError,

  // Error analysis utilities
  analyzeTestingError,
  isRetryableError,

  // Error formatting utilities
  formatTestingError,
  extractErrorSummary,
};
