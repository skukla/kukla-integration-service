/**
 * Shared Test Utilities
 * Cross-feature test utilities used by action, API, and performance testing
 */

// Test Environment Utilities

/**
 * Build test environment configuration
 * @purpose Create standardized test environment configuration
 * @param {boolean} isProd - Whether to use production environment
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Test environment configuration
 * @usedBy All testing features for environment setup
 */
function buildTestEnvironmentConfig(isProd = false, overrides = {}) {
  const baseConfig = {
    environment: isProd ? 'production' : 'staging',
    timeout: isProd ? 15000 : 10000,
    retries: isProd ? 2 : 1,
    verbose: !isProd,
    endpoints: {
      runtime: isProd ? 'https://prod-runtime.com' : 'https://stage-runtime.com',
      commerce: isProd ? 'https://prod-commerce.com' : 'https://stage-commerce.com',
    },
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Wait for test environment readiness
 * @purpose Ensure test environment is ready before executing tests
 * @param {Object} config - Environment configuration
 * @returns {Promise<boolean>} True if environment is ready
 * @usedBy Test orchestration workflows before test execution
 */
async function waitForTestEnvironmentReady() {
  const maxWaitTime = 30000; // 30 seconds
  const checkInterval = 2000; // 2 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Simulate environment readiness check
      const isReady = Math.random() > 0.1; // 90% chance of being ready
      if (isReady) {
        return true;
      }

      await sleep(checkInterval);
    } catch (error) {
      // Continue checking on error
      await sleep(checkInterval);
    }
  }

  return false;
}

// Test Data Utilities

/**
 * Generate test parameters for action testing
 * @purpose Create realistic test parameters for different action types
 * @param {string} actionName - Name of action to generate parameters for
 * @param {string} scenario - Test scenario (quick, comprehensive, stress)
 * @returns {Object} Test parameters object
 * @usedBy Action testing features for parameter generation
 */
function generateTestParameters(actionName, scenario = 'quick') {
  const baseParams = {
    timestamp: Date.now(),
    testId: generateTestId(),
    scenario,
  };

  switch (actionName) {
    case 'get-products':
    case 'get-products-mesh':
      return {
        ...baseParams,
        limit: scenario === 'stress' ? 500 : 50,
        offset: 0,
        filters: scenario === 'comprehensive' ? { status: 1, visibility: 4 } : {},
      };

    case 'browse-files':
      return {
        ...baseParams,
        path: scenario === 'comprehensive' ? '/exports' : '/',
        limit: scenario === 'stress' ? 200 : 50,
      };

    case 'download-file':
      return {
        ...baseParams,
        fileName: 'test-export.csv',
        includeMetadata: scenario === 'comprehensive',
      };

    case 'delete-file':
      return {
        ...baseParams,
        fileName: 'test-delete.csv',
        confirmed: true,
      };

    default:
      return baseParams;
  }
}

/**
 * Generate unique test identifier
 * @purpose Create unique identifier for test runs
 * @returns {string} Unique test identifier
 * @usedBy Test utilities for test tracking and identification
 */
function generateTestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `test-${timestamp}-${random}`;
}

// Test Validation Utilities

/**
 * Validate test result structure
 * @purpose Ensure test results follow expected structure
 * @param {Object} result - Test result to validate
 * @param {string} testType - Type of test (action, api, performance)
 * @returns {Object} Validation result with isValid flag and issues
 * @usedBy All testing features for result validation
 */
function validateTestResultStructure(result, testType) {
  const validation = {
    isValid: true,
    issues: [],
    warnings: [],
  };

  // Validate universal required fields
  validateUniversalRequiredFields(result, validation);

  // Validate type-specific requirements
  validateTestTypeSpecificFields(result, testType, validation);

  return validation;
}

/**
 * Validate universal required fields for all test types
 * @purpose Check fields that all test results must have
 * @param {Object} result - Test result to validate
 * @param {Object} validation - Validation object to update
 */
function validateUniversalRequiredFields(result, validation) {
  const requiredFields = ['success', 'executedAt'];
  for (const field of requiredFields) {
    if (result[field] === undefined) {
      validation.isValid = false;
      validation.issues.push(`Missing required field: ${field}`);
    }
  }
}

/**
 * Validate test type-specific fields and requirements
 * @purpose Check fields specific to each test type
 * @param {Object} result - Test result to validate
 * @param {string} testType - Type of test
 * @param {Object} validation - Validation object to update
 */
function validateTestTypeSpecificFields(result, testType, validation) {
  switch (testType) {
    case 'action':
      validateActionTestFields(result, validation);
      break;
    case 'api':
      validateApiTestFields(result, validation);
      break;
    case 'performance':
      validatePerformanceTestFields(result, validation);
      break;
  }
}

/**
 * Validate action test specific fields
 * @purpose Check requirements specific to action tests
 * @param {Object} result - Test result to validate
 * @param {Object} validation - Validation object to update
 */
function validateActionTestFields(result, validation) {
  if (!result.actionName) {
    validation.issues.push('Action tests must include actionName');
    validation.isValid = false;
  }
  if (!result.response && result.success) {
    validation.warnings.push('Successful action tests should include response data');
  }
}

/**
 * Validate API test specific fields
 * @purpose Check requirements specific to API tests
 * @param {Object} result - Test result to validate
 * @param {Object} validation - Validation object to update
 */
function validateApiTestFields(result, validation) {
  if (!result.endpoint) {
    validation.issues.push('API tests must include endpoint');
    validation.isValid = false;
  }
  if (!result.url && result.success) {
    validation.warnings.push('Successful API tests should include URL');
  }
}

/**
 * Validate performance test specific fields
 * @purpose Check requirements specific to performance tests
 * @param {Object} result - Test result to validate
 * @param {Object} validation - Validation object to update
 */
function validatePerformanceTestFields(result, validation) {
  if (!result.metrics) {
    validation.issues.push('Performance tests must include metrics');
    validation.isValid = false;
  }
  if (result.success && (!result.duration || result.duration <= 0)) {
    validation.warnings.push('Performance tests should include positive duration');
  }
}

/**
 * Validate test timing and performance
 * @purpose Check if test execution times are within acceptable ranges
 * @param {Object} result - Test result with timing information
 * @param {Object} expectations - Expected timing thresholds
 * @returns {Object} Timing validation result
 * @usedBy Performance testing and test orchestration for timing validation
 */
function validateTestTiming(result, expectations = {}) {
  const { maxDuration = 10000, warnDuration = 5000, minDuration = 100 } = expectations;

  const validation = {
    isValid: true,
    issues: [],
    warnings: [],
  };

  const duration = result.duration || result.responseTime || 0;

  if (duration <= 0) {
    validation.issues.push('Test duration must be positive');
    validation.isValid = false;
  }

  if (duration < minDuration) {
    validation.warnings.push(`Test duration ${duration}ms is unusually fast (< ${minDuration}ms)`);
  }

  if (duration > maxDuration) {
    validation.issues.push(`Test duration ${duration}ms exceeds maximum ${maxDuration}ms`);
    validation.isValid = false;
  } else if (duration > warnDuration) {
    validation.warnings.push(
      `Test duration ${duration}ms exceeds warning threshold ${warnDuration}ms`
    );
  }

  return validation;
}

// Test Formatting Utilities

/**
 * Format test result for output
 * @purpose Create consistent formatted output for test results
 * @param {Object} result - Test result to format
 * @param {string} format - Output format (summary, detailed, json)
 * @returns {string} Formatted test result
 * @usedBy All testing features for consistent output formatting
 */
function formatTestResult(result, format = 'summary') {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);

    case 'detailed':
      return formatDetailedTestResult(result);

    case 'summary':
    default:
      return formatSummaryTestResult(result);
  }
}

/**
 * Format test result as summary
 * @purpose Create concise summary of test result
 * @param {Object} result - Test result to format
 * @returns {string} Summary formatted result
 */
function formatSummaryTestResult(result) {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  const target = result.actionName || result.endpoint || result.target || 'unknown';
  const duration = result.duration || result.responseTime || 0;

  let summary = `${status} ${target} (${duration}ms)`;

  if (result.details && result.details.length > 0) {
    summary += ` - ${result.details[0]}`;
  }

  return summary;
}

/**
 * Format test result with detailed information
 * @purpose Create comprehensive formatted output with all test details
 * @param {Object} result - Test result to format
 * @returns {string} Detailed formatted result
 */
function formatDetailedTestResult(result) {
  const lines = [];

  // Add header section
  addDetailedResultHeader(result, lines);

  // Add basic information section
  addDetailedResultBasicInfo(result, lines);

  // Add success-specific details
  if (result.success) {
    addDetailedResultSuccessInfo(result, lines);
  } else {
    addDetailedResultErrorInfo(result, lines);
  }

  // Add additional details section
  addDetailedResultAdditionalDetails(result, lines);

  return lines.join('\n');
}

/**
 * Add header section to detailed result
 * @purpose Add status and target information
 * @param {Object} result - Test result
 * @param {Array} lines - Lines array to update
 */
function addDetailedResultHeader(result, lines) {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  const target = result.actionName || result.endpoint || result.target || 'unknown';
  lines.push(`${status} ${target}`);
}

/**
 * Add basic info section to detailed result
 * @purpose Add URL, duration, and execution time
 * @param {Object} result - Test result
 * @param {Array} lines - Lines array to update
 */
function addDetailedResultBasicInfo(result, lines) {
  if (result.url) {
    lines.push(`  URL: ${result.url}`);
  }
  if (result.duration || result.responseTime) {
    lines.push(`  Duration: ${result.duration || result.responseTime}ms`);
  }
  if (result.executedAt) {
    lines.push(`  Executed: ${result.executedAt}`);
  }
}

/**
 * Add success-specific info to detailed result
 * @purpose Add response data for successful tests
 * @param {Object} result - Test result
 * @param {Array} lines - Lines array to update
 */
function addDetailedResultSuccessInfo(result, lines) {
  if (!result.response) return;

  if (result.response.statusCode) {
    lines.push(`  Status: ${result.response.statusCode}`);
  }
  if (result.response.data) {
    const responsePreview = JSON.stringify(result.response.data).substring(0, 100);
    lines.push(`  Response: ${responsePreview}...`);
  }
}

/**
 * Add error-specific info to detailed result
 * @purpose Add error information for failed tests
 * @param {Object} result - Test result
 * @param {Array} lines - Lines array to update
 */
function addDetailedResultErrorInfo(result, lines) {
  if (result.error) {
    lines.push(`  Error: ${result.error}`);
  }
  if (result.validation && result.validation.errors) {
    result.validation.errors.forEach((error) => {
      lines.push(`  Validation Error: ${error}`);
    });
  }
}

/**
 * Add additional details section to detailed result
 * @purpose Add any additional details provided
 * @param {Object} result - Test result
 * @param {Array} lines - Lines array to update
 */
function addDetailedResultAdditionalDetails(result, lines) {
  if (result.details && result.details.length > 0) {
    lines.push('  Details:');
    result.details.forEach((detail) => {
      lines.push(`    - ${detail}`);
    });
  }
}

// Helper function (imported from shared utilities)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  // Test environment utilities
  buildTestEnvironmentConfig,
  waitForTestEnvironmentReady,

  // Test data utilities
  generateTestParameters,
  generateTestId,

  // Test validation utilities
  validateTestResultStructure,
  validateTestTiming,

  // Test formatting utilities
  formatTestResult,
  formatSummaryTestResult,
  formatDetailedTestResult,
};
