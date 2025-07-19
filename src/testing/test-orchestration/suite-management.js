/**
 * Test Orchestration - Suite Management Sub-module
 * All test suite management utilities including command parsing, validation, and suite configuration
 */

// Suite Management Workflows

/**
 * Parse test orchestration options into executable test plan
 * @purpose Convert command line options and configuration into structured test plan
 * @param {Object} options - Raw test orchestration options
 * @returns {Object} Structured test plan with commands, targets, and configuration
 * @usedBy executeTestOrchestrationWorkflow
 */
function parseTestOrchestrationOptions(options) {
  const {
    command = 'auto',
    target = 'all',
    suite = null,
    parallel = true,
    timeout = 30000,
    verbose = false,
    args = [],
    ...otherOptions
  } = options;

  // Parse command arguments if provided
  const parsedArgs = args.length > 0 ? parseTestCommandArgs(args) : {};

  // Determine appropriate test suite
  const determinedSuite = determinateTestSuite(command, target, suite);

  // Get suite configuration
  const suiteConfig = getTestSuiteConfiguration(determinedSuite);

  return {
    command,
    target,
    suite: determinedSuite,
    suiteConfig,
    parallel,
    timeout,
    verbose,
    parsedArgs,
    executionMode: parallel ? 'parallel' : 'sequential',
    startTime: new Date().toISOString(),
    ...otherOptions,
  };
}

/**
 * Validate test orchestration plan
 * @purpose Ensure test plan is valid and executable
 * @param {Object} testPlan - Structured test plan to validate
 * @returns {Object} Validation result with errors and warnings
 * @usedBy executeTestOrchestrationWorkflow
 */
function validateTestOrchestrationPlan(testPlan) {
  const errors = [];
  const warnings = [];

  // Validate command
  if (!testPlan.command) {
    errors.push('Test command is required');
  }

  // Validate target
  if (!testPlan.target) {
    errors.push('Test target is required');
  }

  // Validate suite configuration
  if (!testPlan.suiteConfig) {
    errors.push(`Unknown test suite: ${testPlan.suite}`);
  } else {
    // Validate suite-specific requirements
    validateSuiteConfiguration(testPlan.suiteConfig, errors, warnings);
  }

  // Validate timeout
  if (testPlan.timeout && (typeof testPlan.timeout !== 'number' || testPlan.timeout <= 0)) {
    errors.push('Timeout must be a positive number');
  }

  // Validate execution mode
  if (!['parallel', 'sequential'].includes(testPlan.executionMode)) {
    warnings.push(`Unknown execution mode: ${testPlan.executionMode}, defaulting to parallel`);
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors,
    warnings,
  };
}

/**
 * Validate suite configuration
 * @purpose Check suite-specific configuration requirements
 * @param {Object} suiteConfig - Suite configuration to validate
 * @param {Array} errors - Array to collect validation errors
 * @param {Array} warnings - Array to collect validation warnings
 * @usedBy validateTestOrchestrationPlan
 */
function validateSuiteConfiguration(suiteConfig, errors, warnings) {
  if (!suiteConfig.tests || !Array.isArray(suiteConfig.tests)) {
    errors.push('Suite configuration must include tests array');
    return;
  }

  if (suiteConfig.tests.length === 0) {
    warnings.push('Suite configuration contains no tests');
  }

  // Validate each test in the suite
  suiteConfig.tests.forEach((test, index) => {
    if (!test.type) {
      errors.push(`Test ${index + 1} missing type field`);
    }

    if (!test.target) {
      errors.push(`Test ${index + 1} missing target field`);
    }
  });
}

// Command Argument Parsing

/**
 * Parse test command arguments
 * @purpose Extract structured information from command line arguments
 * @param {Array} args - Array of command line arguments
 * @returns {Object} Parsed arguments object
 * @usedBy parseTestOrchestrationOptions
 */
function parseTestCommandArgs(args) {
  const parsed = {
    flags: [],
    options: {},
    targets: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long option (--option=value or --option value)
      const [key, value] = arg.substring(2).split('=');

      if (value !== undefined) {
        parsed.options[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed.options[key] = args[i + 1];
        i++; // Skip next argument
      } else {
        parsed.flags.push(key);
      }
    } else if (arg.startsWith('-')) {
      // Short flag
      parsed.flags.push(arg.substring(1));
    } else {
      // Target or positional argument
      parsed.targets.push(arg);
    }
  }

  return parsed;
}

// Test Suite Configuration

/**
 * Determine appropriate test suite based on command and target
 * @purpose Select the most appropriate test suite for execution
 * @param {string} command - Test command type
 * @param {string} target - Test target
 * @param {string} explicitSuite - Explicitly specified suite (optional)
 * @returns {string} Selected test suite name
 * @usedBy parseTestOrchestrationOptions
 */
function determinateTestSuite(command, target, explicitSuite) {
  // If suite is explicitly specified, use it
  if (explicitSuite) {
    return explicitSuite;
  }

  // Determine suite based on command and target
  const suiteMapping = {
    action: 'action-suite',
    api: 'api-suite',
    performance: 'performance-suite',
    suite: 'comprehensive-suite',
    auto: determineAutoSuite(target),
  };

  return suiteMapping[command] || 'default-suite';
}

/**
 * Determine automatic test suite based on target
 * @purpose Intelligently select test suite when command is 'auto'
 * @param {string} target - Test target
 * @returns {string} Automatically determined suite name
 * @usedBy determinateTestSuite
 */
function determineAutoSuite(target) {
  // Action targets
  if (
    ['get-products', 'get-products-mesh', 'browse-files', 'download-file', 'delete-file'].includes(
      target
    )
  ) {
    return 'action-suite';
  }

  // API targets
  if (['products', 'categories', 'customers', 'orders'].includes(target)) {
    return 'api-suite';
  }

  // Performance targets
  if (target.includes('performance') || target.includes('stress')) {
    return 'performance-suite';
  }

  // Default comprehensive suite
  return 'comprehensive-suite';
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
  // Suite Management Workflows
  parseTestOrchestrationOptions,
  validateTestOrchestrationPlan,

  // Suite Management Operations
  determinateTestSuite,
  determineAutoSuite,
  getTestSuiteConfiguration,
  buildSuiteConfigurations,
  buildActionSuiteConfig,
  buildApiSuiteConfig,
  buildPerformanceSuiteConfig,
  buildComprehensiveSuiteConfig,
  buildSmokeSuiteConfig,
  buildDefaultSuiteConfig,
  getAvailableTestSuites,
};
