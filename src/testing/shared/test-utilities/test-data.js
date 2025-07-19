/**
 * Test Utilities - Test Data Sub-module
 * Test data generation, parameter creation, and ID generation utilities
 */

/**
 * Generate test data for different test types
 * @purpose Create standardized test data based on test type and requirements
 * @param {string} testType - Type of test (action, api, performance)
 * @param {Object} options - Test data generation options
 * @returns {Object} Generated test data
 * @usedBy All testing features for data preparation
 */
function generateTestData(testType, options = {}) {
  const baseData = {
    timestamp: new Date().toISOString(),
    testId: generateTestId(),
    environment: options.environment || 'test',
  };

  switch (testType) {
    case 'action':
      return generateActionTestData(baseData, options);
    case 'api':
      return generateApiTestData(baseData, options);
    case 'performance':
      return generatePerformanceTestData(baseData, options);
    default:
      return baseData;
  }
}

/**
 * Generate action test data
 * @purpose Create test data specific to action testing
 * @param {Object} baseData - Base test data structure
 * @param {Object} options - Action-specific options
 * @returns {Object} Action test data
 * @usedBy generateTestData
 */
function generateActionTestData(baseData, options) {
  return {
    ...baseData,
    params: options.params || {},
    expectedFields: options.expectedFields || ['success', 'message'],
    timeout: options.timeout || 10000,
  };
}

/**
 * Generate API test data
 * @purpose Create test data specific to API testing
 * @param {Object} baseData - Base test data structure
 * @param {Object} options - API-specific options
 * @returns {Object} API test data
 * @usedBy generateTestData
 */
function generateApiTestData(baseData, options) {
  return {
    ...baseData,
    endpoint: options.endpoint || '/test',
    method: options.method || 'GET',
    headers: options.headers || { 'Content-Type': 'application/json' },
    expectedStatus: options.expectedStatus || 200,
  };
}

/**
 * Generate performance test data
 * @purpose Create test data specific to performance testing
 * @param {Object} baseData - Base test data structure
 * @param {Object} options - Performance-specific options
 * @returns {Object} Performance test data
 * @usedBy generateTestData
 */
function generatePerformanceTestData(baseData, options) {
  return {
    ...baseData,
    iterations: options.iterations || 10,
    maxResponseTime: options.maxResponseTime || 5000,
    concurrency: options.concurrency || 1,
    rampUp: options.rampUp || 0,
  };
}

/**
 * Generate test parameters for different scenarios
 * @purpose Create parameter sets for comprehensive testing
 * @param {string} scenario - Test scenario name
 * @param {Object} baseParams - Base parameters to extend
 * @returns {Array} Array of parameter sets
 * @usedBy Test orchestration for scenario testing
 */
function generateTestParameters(scenario, baseParams = {}) {
  const parameterSets = [];

  switch (scenario) {
    case 'pagination':
      parameterSets.push(
        { ...baseParams, limit: 10, offset: 0 },
        { ...baseParams, limit: 25, offset: 0 },
        { ...baseParams, limit: 50, offset: 25 }
      );
      break;
    case 'filtering':
      parameterSets.push(
        { ...baseParams, category: 'electronics' },
        { ...baseParams, category: 'clothing' },
        { ...baseParams, priceRange: '100-500' }
      );
      break;
    case 'edge-cases':
      parameterSets.push(
        { ...baseParams, limit: 0 }, // Empty result
        { ...baseParams, limit: 1000 }, // Large result
        { ...baseParams, invalidParam: 'test' } // Invalid parameter
      );
      break;
    default:
      parameterSets.push(baseParams);
  }

  return parameterSets;
}

/**
 * Generate unique test ID
 * @purpose Create unique identifier for test runs
 * @returns {string} Unique test ID
 * @usedBy Test data generation and result tracking
 */
function generateTestId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

module.exports = {
  generateTestData,
  generateTestParameters,
  generateTestId,
};
