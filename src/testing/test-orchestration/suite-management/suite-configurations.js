/**
 * Suite Management - Suite Configurations Sub-module
 * All test suite configuration building utilities
 */

// Workflows

/**
 * Build complete suite configurations object
 * @purpose Create all available test suite configurations
 * @returns {Object} Object containing all suite configurations
 * @usedBy getTestSuiteConfiguration
 */
function buildSuiteConfigurations() {
  return {
    'action-suite': buildActionSuiteConfig(),
    'api-suite': buildApiSuiteConfig(),
    'performance-suite': buildPerformanceSuiteConfig(),
    'comprehensive-suite': buildComprehensiveSuiteConfig(),
    'smoke-suite': buildSmokeSuiteConfig(),
    'default-suite': buildDefaultSuiteConfig(),
  };
}

/**
 * Get test suite configuration
 * @purpose Retrieve configuration for a specific test suite
 * @param {string} suiteName - Name of the test suite
 * @returns {Object} Test suite configuration with tests and options
 * @usedBy parseTestOrchestrationOptions
 */
function getTestSuiteConfiguration(suiteName) {
  const suiteConfigurations = buildSuiteConfigurations();
  return suiteConfigurations[suiteName] || suiteConfigurations['default-suite'];
}

// Utilities

/**
 * Build action suite configuration
 * @purpose Create action test suite configuration
 * @returns {Object} Action suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildActionSuiteConfig() {
  return {
    name: 'Action Test Suite',
    description: 'Test all Adobe I/O Runtime actions',
    parallel: true,
    timeout: 30000,
    tests: [
      { type: 'action', target: 'get-products', timeout: 10000 },
      { type: 'action', target: 'get-products-mesh', timeout: 15000 },
      { type: 'action', target: 'browse-files', timeout: 5000 },
      { type: 'action', target: 'download-file', timeout: 8000 },
      { type: 'action', target: 'delete-file', timeout: 5000 },
    ],
  };
}

/**
 * Build API suite configuration
 * @purpose Create API test suite configuration
 * @returns {Object} API suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildApiSuiteConfig() {
  return {
    name: 'API Test Suite',
    description: 'Test all Commerce API endpoints',
    parallel: true,
    timeout: 25000,
    tests: [
      { type: 'api', target: 'products', timeout: 8000 },
      { type: 'api', target: 'categories', timeout: 6000 },
      { type: 'api', target: 'customers', timeout: 6000 },
      { type: 'api', target: 'orders', timeout: 8000 },
    ],
  };
}

/**
 * Build performance suite configuration
 * @purpose Create performance test suite configuration
 * @returns {Object} Performance suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildPerformanceSuiteConfig() {
  return {
    name: 'Performance Test Suite',
    description: 'Performance testing for critical paths',
    parallel: false, // Performance tests should run sequentially
    timeout: 60000,
    tests: [
      { type: 'performance', target: 'get-products', scenario: 'quick', timeout: 15000 },
      { type: 'performance', target: 'get-products-mesh', scenario: 'quick', timeout: 20000 },
      { type: 'performance', target: 'products', scenario: 'baseline', timeout: 12000 },
    ],
  };
}

/**
 * Build comprehensive suite configuration
 * @purpose Create comprehensive test suite configuration
 * @returns {Object} Comprehensive suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildComprehensiveSuiteConfig() {
  return {
    name: 'Comprehensive Test Suite',
    description: 'Full test coverage including actions, APIs, and performance',
    parallel: true,
    timeout: 120000,
    tests: [
      // Action tests
      { type: 'action', target: 'get-products', timeout: 10000 },
      { type: 'action', target: 'browse-files', timeout: 5000 },
      // API tests
      { type: 'api', target: 'products', timeout: 8000 },
      { type: 'api', target: 'categories', timeout: 6000 },
      // Performance tests (sequential within suite)
      { type: 'performance', target: 'get-products', scenario: 'quick', timeout: 15000 },
    ],
  };
}

/**
 * Build smoke suite configuration
 * @purpose Create smoke test suite configuration
 * @returns {Object} Smoke suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildSmokeSuiteConfig() {
  return {
    name: 'Smoke Test Suite',
    description: 'Quick validation of core functionality',
    parallel: true,
    timeout: 15000,
    tests: [
      { type: 'action', target: 'get-products', timeout: 8000 },
      { type: 'api', target: 'products', timeout: 6000 },
    ],
  };
}

/**
 * Build default suite configuration
 * @purpose Create default test suite configuration
 * @returns {Object} Default suite configuration
 * @usedBy buildSuiteConfigurations
 */
function buildDefaultSuiteConfig() {
  return {
    name: 'Default Test Suite',
    description: 'Default test configuration',
    parallel: true,
    timeout: 20000,
    tests: [{ type: 'action', target: 'get-products', timeout: 10000 }],
  };
}

/**
 * Get available test suites
 * @purpose List all available test suite names
 * @returns {Array} Array of available test suite names
 * @usedBy Test configuration and help utilities
 */
function getAvailableTestSuites() {
  return [
    'action-suite',
    'api-suite',
    'performance-suite',
    'comprehensive-suite',
    'smoke-suite',
    'default-suite',
  ];
}

module.exports = {
  // Workflows
  buildSuiteConfigurations,
  getTestSuiteConfiguration,

  // Utilities
  buildActionSuiteConfig,
  buildApiSuiteConfig,
  buildPerformanceSuiteConfig,
  buildComprehensiveSuiteConfig,
  buildSmokeSuiteConfig,
  buildDefaultSuiteConfig,
  getAvailableTestSuites,
};
