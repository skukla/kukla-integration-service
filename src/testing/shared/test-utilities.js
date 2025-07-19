/**
 * Shared Test Utilities - Feature Core
 * Cross-feature test utilities used by action, API, and performance testing
 */

// Import test operations from sub-modules
const {
  generateTestData,
  generateTestParameters,
  generateTestId,
} = require('./test-utilities/test-data');
const {
  buildTestEnvironmentConfig,
  setupTestEnvironment,
  cleanupTestEnvironment,
} = require('./test-utilities/test-environment');

// Test Validation Utilities

/**
 * Validate test result structure
 * @purpose Ensure test results contain required fields and valid data
 * @param {Object} result - Test result object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result with status and messages
 * @usedBy All testing features for result validation
 */
function validateTestResultStructure(result, requiredFields = ['success', 'timing']) {
  const validation = {
    valid: true,
    messages: [],
  };

  if (!result || typeof result !== 'object') {
    validation.valid = false;
    validation.messages.push('Test result must be an object');
    return validation;
  }

  for (const field of requiredFields) {
    if (result[field] === undefined) {
      validation.valid = false;
      validation.messages.push(`Missing required field: ${field}`);
    }
  }

  // Validate timing data if present
  if (result.timing && typeof result.timing !== 'object') {
    validation.valid = false;
    validation.messages.push('Timing data must be an object');
  }

  return validation;
}

/**
 * Validate test timing data
 * @purpose Ensure timing measurements are valid and consistent
 * @param {Object} timing - Timing object to validate
 * @returns {Object} Validation result with status and messages
 * @usedBy Performance and timing validation
 */
function validateTestTiming(timing) {
  const validation = {
    valid: true,
    messages: [],
  };

  if (!timing || typeof timing !== 'object') {
    validation.valid = false;
    validation.messages.push('Timing data must be an object');
    return validation;
  }

  // Check for negative values
  if (timing.duration && timing.duration < 0) {
    validation.valid = false;
    validation.messages.push('Duration cannot be negative');
  }

  if (timing.startTime && timing.endTime) {
    const calculatedDuration = timing.endTime - timing.startTime;
    if (timing.duration && Math.abs(timing.duration - calculatedDuration) > 10) {
      validation.messages.push('Duration inconsistent with start/end times');
    }
  }

  return validation;
}

// Test Formatting Utilities

/**
 * Format test result for display
 * @purpose Convert test result to formatted string representation
 * @param {Object} result - Test result to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted test result
 * @usedBy Test reporting and logging
 */
function formatTestResult(result, options = {}) {
  const { detailed = false } = options;

  if (detailed) {
    return formatDetailedTestResult(result, options);
  } else {
    return formatSummaryTestResult(result);
  }
}

/**
 * Format test result summary
 * @purpose Create concise test result summary
 * @param {Object} result - Test result to format
 * @param {Object} options - Formatting options
 * @returns {string} Summary format
 * @usedBy formatTestResult
 */
function formatSummaryTestResult(result) {
  if (!result) return 'No result';

  const status = result.success ? '✅ PASS' : '❌ FAIL';
  const timing = result.timing?.duration ? ` (${result.timing.duration}ms)` : '';
  const name = result.name || result.target || 'Test';

  return `${status} ${name}${timing}`;
}

/**
 * Format detailed test result
 * @purpose Create comprehensive test result display
 * @param {Object} result - Test result to format
 * @param {Object} options - Formatting options
 * @returns {string} Detailed format
 * @usedBy formatTestResult
 */
function formatDetailedTestResult(result, options = {}) {
  if (!result) return 'No result available';

  const { includeStack = false } = options;
  let output = [];

  output.push(`Test: ${result.name || result.target || 'Unknown'}`);
  output.push(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);

  if (result.timing) {
    output.push(`Duration: ${result.timing.duration || 0}ms`);
  }

  if (result.message) {
    output.push(`Message: ${result.message}`);
  }

  if (!result.success && result.error) {
    output.push(`Error: ${result.error}`);

    if (includeStack && result.stack) {
      output.push(`Stack: ${result.stack}`);
    }
  }

  if (result.metadata) {
    output.push(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
  }

  return output.join('\n');
}

module.exports = {
  // Test environment utilities
  buildTestEnvironmentConfig,
  setupTestEnvironment,
  cleanupTestEnvironment,

  // Test data utilities
  generateTestData,
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
