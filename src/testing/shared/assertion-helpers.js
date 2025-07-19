/**
 * Shared Assertion Helpers - Feature Core
 * Cross-feature assertion utilities for test validation and verification
 */

// Import assertion operations from sub-modules
const {
  assertActionSuccess,
  assertActionDownloadUrl,
} = require('./assertion-helpers/action-assertions');
const {
  assertResponseStructure,
  assertResponseStatus,
  assertResponseContainsData,
} = require('./assertion-helpers/response-assertions');

// Performance Assertion Helpers

/**
 * Assert execution time is within acceptable range
 * @purpose Validate that operation completed within expected time limits
 * @param {number} executionTime - Actual execution time in milliseconds
 * @param {number} maxTime - Maximum acceptable time in milliseconds
 * @param {number} minTime - Minimum expected time in milliseconds (default: 0)
 * @returns {Object} Assertion result
 * @usedBy Performance testing for timing validation
 */
function assertExecutionTime(executionTime, maxTime, minTime = 0) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (typeof executionTime !== 'number' || executionTime < 0) {
    assertion.pass = false;
    assertion.messages.push('Execution time must be a non-negative number');
    return assertion;
  }

  if (executionTime < minTime) {
    assertion.pass = false;
    assertion.messages.push(`Execution time ${executionTime}ms is below minimum ${minTime}ms`);
  }

  if (executionTime > maxTime) {
    assertion.pass = false;
    assertion.messages.push(`Execution time ${executionTime}ms exceeds maximum ${maxTime}ms`);
  }

  return assertion;
}

/**
 * Assert performance metrics meet standards
 * @purpose Validate that performance metrics are within acceptable ranges
 * @param {Object} metrics - Performance metrics object
 * @param {Object} standards - Expected performance standards
 * @returns {Object} Assertion result
 * @usedBy Performance testing for comprehensive metrics validation
 */
function assertPerformanceMetrics(metrics, standards) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!metrics || typeof metrics !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Performance metrics must be an object');
    return assertion;
  }

  if (!standards || typeof standards !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Performance standards must be an object');
    return assertion;
  }

  validatePerformanceStandards(metrics, standards, assertion);
  return assertion;
}

/**
 * Validate performance metrics against standards
 * @purpose Check individual performance metrics against limits
 * @param {Object} metrics - Performance metrics object
 * @param {Object} standards - Expected performance standards
 * @param {Object} assertion - Assertion object to update
 */
function validatePerformanceStandards(metrics, standards, assertion) {
  // Check response time
  if (standards.maxResponseTime && metrics.responseTime > standards.maxResponseTime) {
    assertion.pass = false;
    assertion.messages.push(
      `Response time ${metrics.responseTime}ms exceeds limit ${standards.maxResponseTime}ms`
    );
  }

  // Check throughput
  if (standards.minThroughput && metrics.throughput < standards.minThroughput) {
    assertion.pass = false;
    assertion.messages.push(
      `Throughput ${metrics.throughput} below minimum ${standards.minThroughput}`
    );
  }

  // Check error rate
  if (standards.maxErrorRate && metrics.errorRate > standards.maxErrorRate) {
    assertion.pass = false;
    assertion.messages.push(
      `Error rate ${metrics.errorRate}% exceeds limit ${standards.maxErrorRate}%`
    );
  }
}

// API-Specific Assertion Helpers

/**
 * Assert Commerce API response format
 * @purpose Validate Commerce API response structure and data format
 * @param {Object} response - Commerce API response
 * @param {Object} options - Validation options
 * @returns {Object} Assertion result
 * @usedBy Commerce API testing
 */
function assertCommerceApiFormat(response, options = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  const { expectItems = true, expectPagination = false } = options;

  if (!response || typeof response !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Commerce API response must be an object');
    return assertion;
  }

  if (expectItems && !Array.isArray(response.items)) {
    assertion.pass = false;
    assertion.messages.push('Commerce API response must contain items array');
  }

  if (expectPagination) {
    if (!response.search_criteria) {
      assertion.pass = false;
      assertion.messages.push('Commerce API response must contain search_criteria for pagination');
    }
    if (typeof response.total_count !== 'number') {
      assertion.pass = false;
      assertion.messages.push('Commerce API response must contain total_count for pagination');
    }
  }

  return assertion;
}

/**
 * Assert API pagination structure
 * @purpose Validate API pagination parameters and structure
 * @param {Object} response - API response with pagination
 * @param {Object} expectedPagination - Expected pagination structure
 * @returns {Object} Assertion result
 * @usedBy API testing for pagination validation
 */
function assertApiPagination(response, expectedPagination = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.search_criteria) {
    assertion.pass = false;
    assertion.messages.push('Response must contain search_criteria for pagination validation');
    return assertion;
  }

  const pagination = response.search_criteria;

  if (expectedPagination.pageSize && pagination.page_size !== expectedPagination.pageSize) {
    assertion.pass = false;
    assertion.messages.push(
      `Expected page_size ${expectedPagination.pageSize}, got ${pagination.page_size}`
    );
  }

  if (
    expectedPagination.currentPage &&
    pagination.current_page !== expectedPagination.currentPage
  ) {
    assertion.pass = false;
    assertion.messages.push(
      `Expected current_page ${expectedPagination.currentPage}, got ${pagination.current_page}`
    );
  }

  return assertion;
}

// Test Suite Assertion Helpers

/**
 * Assert test suite results meet expectations
 * @purpose Validate overall test suite execution results
 * @param {Object} suiteResults - Test suite execution results
 * @param {Object} expectations - Expected suite performance
 * @returns {Object} Assertion result
 * @usedBy Test orchestration for suite validation
 */
function assertTestSuiteResults(suiteResults, expectations = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!suiteResults || typeof suiteResults !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Test suite results must be an object');
    return assertion;
  }

  const { minSuccessRate = 80, maxExecutionTime = 60000 } = expectations;

  // Check success rate
  if (suiteResults.successRate < minSuccessRate) {
    assertion.pass = false;
    assertion.messages.push(
      `Success rate ${suiteResults.successRate}% below minimum ${minSuccessRate}%`
    );
  }

  // Check execution time
  if (suiteResults.executionTime > maxExecutionTime) {
    assertion.pass = false;
    assertion.messages.push(
      `Execution time ${suiteResults.executionTime}ms exceeds maximum ${maxExecutionTime}ms`
    );
  }

  return assertion;
}

// Utility Functions

/**
 * Combine multiple assertion results
 * @purpose Merge multiple assertion results into single result
 * @param {Array} assertions - Array of assertion result objects
 * @returns {Object} Combined assertion result
 * @usedBy Complex validation scenarios requiring multiple checks
 */
function combineAssertions(assertions) {
  const combined = {
    pass: true,
    messages: [],
  };

  for (const assertion of assertions) {
    if (!assertion.pass) {
      combined.pass = false;
    }
    combined.messages.push(...assertion.messages);
  }

  return combined;
}

module.exports = {
  // Response assertion helpers
  assertResponseStructure,
  assertResponseStatus,
  assertResponseContainsData,

  // Performance assertion helpers
  assertExecutionTime,
  assertPerformanceMetrics,

  // Action-specific assertion helpers
  assertActionSuccess,
  assertActionDownloadUrl,

  // API-specific assertion helpers
  assertCommerceApiFormat,
  assertApiPagination,

  // Test suite assertion helpers
  assertTestSuiteResults,

  // Utility functions
  combineAssertions,
};
