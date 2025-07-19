/**
 * Test Orchestration - Suite Management Feature Core
 * Complete test suite management capability with organized sub-modules
 */

// Import from suite-management sub-modules
const {
  parseTestCommandArgs,
  determinateTestSuite,
  determineAutoSuite,
} = require('./suite-management/command-parsing');
const {
  buildSuiteConfigurations,
  getTestSuiteConfiguration,
  buildActionSuiteConfig,
  buildApiSuiteConfig,
  buildPerformanceSuiteConfig,
  buildComprehensiveSuiteConfig,
  buildSmokeSuiteConfig,
  buildDefaultSuiteConfig,
  getAvailableTestSuites,
} = require('./suite-management/suite-configurations');

// Workflows

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

// Utilities

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

module.exports = {
  // Workflows
  parseTestOrchestrationOptions,
  validateTestOrchestrationPlan,

  // Operations (re-exported from sub-modules)
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
