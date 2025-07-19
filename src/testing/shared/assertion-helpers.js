/**
 * Shared Assertion Helpers
 * Cross-feature assertion utilities for test validation and verification
 */

// Response Assertion Helpers

/**
 * Assert response structure is valid
 * @purpose Validate that response contains expected structure and fields
 * @param {Object} response - Response object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Assertion result with pass status and messages
 * @usedBy Action and API testing for response validation
 */
function assertResponseStructure(response, requiredFields = []) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || typeof response !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Response must be an object');
    return assertion;
  }

  for (const field of requiredFields) {
    if (response[field] === undefined) {
      assertion.pass = false;
      assertion.messages.push(`Missing required field: ${field}`);
    }
  }

  return assertion;
}

/**
 * Assert response status code
 * @purpose Validate HTTP response status code
 * @param {Object} response - Response object with statusCode
 * @param {number} expectedStatus - Expected status code (default: 200)
 * @returns {Object} Assertion result
 * @usedBy API testing for status code validation
 */
function assertResponseStatus(response, expectedStatus = 200) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || response.statusCode === undefined) {
    assertion.pass = false;
    assertion.messages.push('Response missing statusCode');
    return assertion;
  }

  if (response.statusCode !== expectedStatus) {
    assertion.pass = false;
    assertion.messages.push(`Expected status ${expectedStatus}, got ${response.statusCode}`);
  }

  return assertion;
}

/**
 * Assert response contains data
 * @purpose Validate that response contains expected data
 * @param {Object} response - Response object to check
 * @param {string} dataField - Name of data field (default: 'data')
 * @returns {Object} Assertion result
 * @usedBy Action and API testing for data presence validation
 */
function assertResponseContainsData(response, dataField = 'data') {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response[dataField]) {
    assertion.pass = false;
    assertion.messages.push(`Response missing ${dataField} field`);
  }

  return assertion;
}

// Performance Assertion Helpers

/**
 * Assert execution time within threshold
 * @purpose Validate that operation completed within expected time
 * @param {number} actualTime - Actual execution time in milliseconds
 * @param {number} maxTime - Maximum allowed time in milliseconds
 * @param {string} operation - Name of operation for error messages
 * @returns {Object} Assertion result
 * @usedBy Performance testing for timing validation
 */
function assertExecutionTime(actualTime, maxTime, operation = 'operation') {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (typeof actualTime !== 'number' || actualTime < 0) {
    assertion.pass = false;
    assertion.messages.push(`Invalid execution time: ${actualTime}`);
    return assertion;
  }

  if (actualTime > maxTime) {
    assertion.pass = false;
    assertion.messages.push(`${operation} took ${actualTime}ms, expected ≤ ${maxTime}ms`);
  } else {
    assertion.messages.push(
      `${operation} completed in ${actualTime}ms (within ${maxTime}ms limit)`
    );
  }

  return assertion;
}

/**
 * Assert performance metrics are valid
 * @purpose Validate performance metrics structure and values
 * @param {Object} metrics - Performance metrics object
 * @returns {Object} Assertion result
 * @usedBy Performance testing for metrics validation
 */
function assertPerformanceMetrics(metrics) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!metrics || typeof metrics !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Metrics must be an object');
    return assertion;
  }

  // Validate required metrics presence
  validateRequiredMetrics(metrics, assertion);

  // Validate metric value consistency
  validateMetricValueConsistency(metrics, assertion);

  return assertion;
}

/**
 * Validate that all required performance metrics are present
 * @purpose Check that metrics object contains all required fields
 * @param {Object} metrics - Performance metrics object
 * @param {Object} assertion - Assertion result to update
 */
function validateRequiredMetrics(metrics, assertion) {
  const requiredMetrics = ['averageTime', 'minTime', 'maxTime', 'successRate'];
  for (const metric of requiredMetrics) {
    if (metrics[metric] === undefined) {
      assertion.pass = false;
      assertion.messages.push(`Missing required metric: ${metric}`);
    }
  }
}

/**
 * Validate that metric values are logically consistent
 * @purpose Check that metric values make sense relative to each other
 * @param {Object} metrics - Performance metrics object
 * @param {Object} assertion - Assertion result to update
 */
function validateMetricValueConsistency(metrics, assertion) {
  // Validate time relationship
  if (metrics.minTime !== undefined && metrics.maxTime !== undefined) {
    if (metrics.minTime > metrics.maxTime) {
      assertion.pass = false;
      assertion.messages.push('minTime cannot be greater than maxTime');
    }
  }

  // Validate success rate range
  if (metrics.successRate !== undefined) {
    if (metrics.successRate < 0 || metrics.successRate > 1) {
      assertion.pass = false;
      assertion.messages.push('successRate must be between 0 and 1');
    }
  }
}

// Action-Specific Assertion Helpers

/**
 * Assert action response success
 * @purpose Validate that action completed successfully
 * @param {Object} response - Action response object
 * @returns {Object} Assertion result
 * @usedBy Action testing for success validation
 */
function assertActionSuccess(response) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response) {
    assertion.pass = false;
    assertion.messages.push('No response received');
    return assertion;
  }

  if (response.success !== true) {
    assertion.pass = false;
    assertion.messages.push('Action did not complete successfully');
    if (response.error) {
      assertion.messages.push(`Error: ${response.error}`);
    }
  }

  return assertion;
}

/**
 * Assert action response contains download URL
 * @purpose Validate that action response includes download URL for export actions
 * @param {Object} response - Action response object
 * @returns {Object} Assertion result
 * @usedBy Product export action testing
 */
function assertActionDownloadUrl(response) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.downloadUrl) {
    assertion.pass = false;
    assertion.messages.push('Response missing downloadUrl');
    return assertion;
  }

  if (typeof response.downloadUrl !== 'string') {
    assertion.pass = false;
    assertion.messages.push('downloadUrl must be a string');
  } else if (!response.downloadUrl.startsWith('http')) {
    assertion.pass = false;
    assertion.messages.push('downloadUrl must be a valid URL');
  }

  return assertion;
}

// API-Specific Assertion Helpers

/**
 * Assert API response is Commerce API format
 * @purpose Validate that API response follows Commerce API structure
 * @param {Object} response - API response object
 * @param {string} entityType - Expected entity type (products, categories, etc.)
 * @returns {Object} Assertion result
 * @usedBy API testing for Commerce API format validation
 */
function assertCommerceApiFormat(response, entityType) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.data) {
    assertion.pass = false;
    assertion.messages.push('Missing API response data');
    return assertion;
  }

  const data = response.data;

  // Validate format based on data type
  if (Array.isArray(data) || (data.items && Array.isArray(data.items))) {
    validateCommerceListFormat(data, assertion);
  } else {
    validateCommerceSingleEntityFormat(data, entityType, assertion);
  }

  return assertion;
}

/**
 * Validate Commerce API list format
 * @purpose Check list response structure for Commerce API
 * @param {Object} data - Response data to validate
 * @param {Object} assertion - Assertion result to update
 */
function validateCommerceListFormat(data, assertion) {
  if (data.items && !data.total_count) {
    assertion.messages.push('Warning: List response missing total_count');
  }
}

/**
 * Validate Commerce API single entity format
 * @purpose Check single entity response structure for Commerce API
 * @param {Object} data - Response data to validate
 * @param {string} entityType - Expected entity type
 * @param {Object} assertion - Assertion result to update
 */
function validateCommerceSingleEntityFormat(data, entityType, assertion) {
  if (entityType === 'products') {
    validateProductEntityFormat(data, assertion);
  } else if (entityType === 'categories') {
    validateCategoryEntityFormat(data, assertion);
  }
}

/**
 * Validate product entity format
 * @purpose Check required fields for product entities
 * @param {Object} data - Product data to validate
 * @param {Object} assertion - Assertion result to update
 */
function validateProductEntityFormat(data, assertion) {
  if (!data.sku || !data.name) {
    assertion.pass = false;
    assertion.messages.push('Product response missing required fields (sku, name)');
  }
}

/**
 * Validate category entity format
 * @purpose Check required fields for category entities
 * @param {Object} data - Category data to validate
 * @param {Object} assertion - Assertion result to update
 */
function validateCategoryEntityFormat(data, assertion) {
  if (!data.id || !data.name) {
    assertion.pass = false;
    assertion.messages.push('Category response missing required fields (id, name)');
  }
}

/**
 * Assert API response pagination
 * @purpose Validate API response pagination structure
 * @param {Object} response - API response object
 * @param {Object} expectedPagination - Expected pagination parameters
 * @returns {Object} Assertion result
 * @usedBy API testing for pagination validation
 */
function assertApiPagination(response, expectedPagination = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.data) {
    assertion.pass = false;
    assertion.messages.push('Missing API response data');
    return assertion;
  }

  const data = response.data;

  if (data.search_criteria) {
    const { pageSize, currentPage } = expectedPagination;

    if (pageSize && data.search_criteria.page_size !== pageSize) {
      assertion.messages.push(
        `Expected pageSize ${pageSize}, got ${data.search_criteria.page_size}`
      );
    }

    if (currentPage && data.search_criteria.current_page !== currentPage) {
      assertion.messages.push(
        `Expected currentPage ${currentPage}, got ${data.search_criteria.current_page}`
      );
    }
  }

  if (expectedPagination.maxItems && data.total_count > expectedPagination.maxItems) {
    assertion.messages.push(
      `Warning: Response has ${data.total_count} items, expected ≤ ${expectedPagination.maxItems}`
    );
  }

  return assertion;
}

// Test Suite Assertion Helpers

/**
 * Assert test suite results
 * @purpose Validate overall test suite execution results
 * @param {Object} suiteResults - Test suite results object
 * @param {Object} expectations - Expected suite outcomes
 * @returns {Object} Assertion result
 * @usedBy Test orchestration for suite validation
 */
function assertTestSuiteResults(suiteResults, expectations = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!suiteResults || !suiteResults.metrics) {
    assertion.pass = false;
    assertion.messages.push('Missing test suite metrics');
    return assertion;
  }

  const { metrics } = suiteResults;
  const { minSuccessRate = 0.8, maxFailures = 5, maxDuration = 60000 } = expectations;

  // Check success rate
  if (metrics.successRate < minSuccessRate) {
    assertion.pass = false;
    assertion.messages.push(
      `Success rate ${(metrics.successRate * 100).toFixed(1)}% below minimum ${minSuccessRate * 100}%`
    );
  }

  // Check failure count
  if (metrics.failedTests > maxFailures) {
    assertion.pass = false;
    assertion.messages.push(`${metrics.failedTests} failures exceeds maximum ${maxFailures}`);
  }

  // Check duration
  if (metrics.totalDuration > maxDuration) {
    assertion.messages.push(
      `Suite duration ${metrics.totalDuration}ms exceeds expected ${maxDuration}ms`
    );
  }

  return assertion;
}

/**
 * Combine multiple assertion results
 * @purpose Aggregate multiple assertion results into single result
 * @param {Array} assertions - Array of assertion result objects
 * @returns {Object} Combined assertion result
 * @usedBy All testing features for multi-step validation
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
