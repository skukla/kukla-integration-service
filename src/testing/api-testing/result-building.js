/**
 * API Testing - Result Building Sub-module
 * All API test result building utilities including success results, error handling, and formatting
 */

// Test Result Building Workflows

/**
 * Build comprehensive API test result
 * @purpose Create complete test result with validation, timing, and formatted output
 * @param {string} endpoint - API endpoint that was tested
 * @param {string} apiUrl - Complete API URL that was called
 * @param {Object} testResult - Raw API test result data
 * @param {Object} validation - Response validation result
 * @param {Object} options - Test options for result customization
 * @returns {Object} Complete formatted API test result
 * @usedBy executeApiTestWorkflow
 */
function buildApiTestResult(endpoint, apiUrl, testResult, validation, options) {
  const { rawOutput = false } = options;

  const result = {
    success: testResult.success && validation.isValid,
    endpoint,
    url: apiUrl,
    duration: testResult.duration,
    statusCode: testResult.statusCode,
    validation: {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    timestamp: testResult.timestamp || new Date().toISOString(),
  };

  // Add response data if requested or if there are validation issues
  if (rawOutput || !validation.isValid || validation.warnings.length > 0) {
    result.responseData = testResult.data;
  }

  // Add response headers for debugging
  if (testResult.headers) {
    result.headers = testResult.headers;
  }

  // Add error details if test failed
  if (!testResult.success) {
    result.error = testResult.error || 'Unknown API test error';
  }

  // Calculate overall test score
  result.score = calculateApiTestScore(testResult, validation);

  return result;
}

/**
 * Build API test error result
 * @purpose Create standardized error result when API test fails completely
 * @param {Error|string} error - Error that occurred during testing
 * @param {string} endpoint - API endpoint that was being tested
 * @returns {Object} Standardized API test error result
 * @usedBy executeApiTestWorkflow, executeApiTestWithParams
 */
function buildApiTestErrorResult(error, endpoint) {
  const errorMessage = error.message || error || 'Unknown API test error';

  return {
    success: false,
    endpoint,
    error: errorMessage,
    duration: 0,
    statusCode: 0,
    validation: {
      isValid: false,
      errorCount: 1,
      warningCount: 0,
      errors: [errorMessage],
      warnings: [],
    },
    score: 0,
    timestamp: new Date().toISOString(),
  };
}

// Test Scoring and Metrics

/**
 * Calculate API test score based on performance and validation
 * @purpose Provide numerical score for API test quality and performance
 * @param {Object} testResult - Raw API test result
 * @param {Object} validation - Response validation result
 * @returns {number} Test score from 0-100
 * @usedBy buildApiTestResult
 */
function calculateApiTestScore(testResult, validation) {
  if (!testResult.success) {
    return 0; // Failed request = 0 score
  }

  let score = 100;

  // Deduct points for validation errors (major issues)
  score -= validation.errors.length * 20;

  // Deduct points for validation warnings (minor issues)
  score -= validation.warnings.length * 5;

  // Deduct points for slow response times
  const { duration } = testResult;
  if (duration > 5000) {
    score -= 30; // Very slow
  } else if (duration > 2000) {
    score -= 15; // Slow
  } else if (duration > 1000) {
    score -= 5; // Acceptable
  }

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

/**
 * Format API test result for display
 * @purpose Create human-readable summary of API test results
 * @param {Object} result - Complete API test result
 * @returns {string} Formatted result summary
 * @usedBy Test display utilities
 */
function formatApiTestResultSummary(result) {
  const status = result.success ? '✅ PASSED' : '❌ FAILED';
  const duration = `${result.duration}ms`;
  const score = `${result.score}/100`;

  let summary = `${status} | ${result.endpoint} | ${duration} | Score: ${score}`;

  if (result.validation.errorCount > 0) {
    summary += ` | ${result.validation.errorCount} errors`;
  }

  if (result.validation.warningCount > 0) {
    summary += ` | ${result.validation.warningCount} warnings`;
  }

  return summary;
}

/**
 * Extract key metrics from API test result
 * @purpose Get essential metrics for monitoring and reporting
 * @param {Object} result - Complete API test result
 * @returns {Object} Key metrics object
 * @usedBy Test monitoring and aggregation
 */
function extractApiTestMetrics(result) {
  return {
    success: result.success,
    duration: result.duration,
    statusCode: result.statusCode,
    score: result.score,
    errorCount: result.validation.errorCount,
    warningCount: result.validation.warningCount,
    endpoint: result.endpoint,
    timestamp: result.timestamp,
  };
}

module.exports = {
  buildApiTestResult,
  buildApiTestErrorResult,
  calculateApiTestScore,
  formatApiTestResultSummary,
  extractApiTestMetrics,
};
