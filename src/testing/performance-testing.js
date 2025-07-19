/**
 * Performance Testing - Feature Core
 * Complete performance testing capability with organized sub-modules for different utility categories
 */

const { loadConfig } = require('../../config');
const { analyzePerformanceTestResults } = require('./performance-testing/baseline-comparison');
const {
  buildPerformanceTestResult,
  buildPerformanceTestErrorResult,
} = require('./performance-testing/reporting');
const {
  loadTestScenario,
  buildPerformanceTestConfig,
  executePerformanceTestScenario,
} = require('./performance-testing/scenario-execution');

// Business Workflows

/**
 * Execute complete performance testing workflow
 * @purpose Run comprehensive performance tests with scenario execution and metrics analysis
 * @param {string} target - Target for performance testing (action name or endpoint)
 * @param {Object} options - Performance test options including scenario and iterations
 * @returns {Promise<Object>} Complete performance test result with metrics and analysis
 * @usedBy scripts/test.js, performance monitoring workflows
 * @config testing.scenarios, testing.expectations.maxExecutionTime
 */
async function executePerformanceTestWorkflow(target, options = {}) {
  try {
    // Step 1: Validate inputs and load test scenario
    const validationResult = validatePerformanceTestInputs(target, options);
    if (!validationResult.isValid) {
      return buildPerformanceTestErrorResult(validationResult.error, target);
    }

    // Step 2: Load configuration and prepare test scenario
    const config = loadConfig({}, options.isProd);
    const scenario = loadTestScenario(options.scenario || 'quick', config);
    const testConfig = buildPerformanceTestConfig(target, scenario, options);

    // Step 3: Execute performance test scenario
    const testResult = await executePerformanceTestScenario(target, testConfig);

    // Step 4: Analyze results and generate comprehensive report
    const analysis = analyzePerformanceTestResults(testResult, scenario, config);

    return buildPerformanceTestResult(target, testResult, analysis, scenario, options);
  } catch (error) {
    return buildPerformanceTestErrorResult(error, target);
  }
}

/**
 * Execute performance test with specific scenario
 * @purpose Run performance test using a specific scenario configuration
 * @param {string} target - Target for performance testing
 * @param {Object} scenarioConfig - Specific scenario configuration
 * @param {Object} options - Additional test options
 * @returns {Promise<Object>} Performance test result with scenario-specific analysis
 * @usedBy Custom performance testing workflows, CI/CD pipelines
 */
async function executePerformanceTestWithScenario(target, scenarioConfig, options = {}) {
  const enhancedOptions = { ...options, scenario: scenarioConfig.name || 'custom' };
  return await executePerformanceTestWorkflow(target, enhancedOptions);
}

// Feature Operations

/**
 * Validate performance test inputs
 * @purpose Validate performance test parameters and environment settings
 * @param {string} target - Target to test
 * @param {Object} options - Performance test options
 * @returns {Object} Validation result with errors and configuration
 * @usedBy executePerformanceTestWorkflow
 */
function validatePerformanceTestInputs(target, options) {
  const errors = [];
  const warnings = [];

  // Validate target
  validatePerformanceTarget(target, errors);

  // Validate options
  validatePerformanceOptions(options, errors);

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors,
    warnings,
  };
}

/**
 * Validate performance test target
 * @purpose Check target name format and validity
 * @param {string} target - Target to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validatePerformanceTestInputs
 */
function validatePerformanceTarget(target, errors) {
  if (!target || typeof target !== 'string') {
    errors.push('Performance test target is required and must be a string');
    return;
  }

  if (!isValidPerformanceTarget(target)) {
    errors.push(`Invalid target: ${target}. Must be a valid action name or endpoint`);
  }
}

/**
 * Validate performance test options
 * @purpose Check options object structure and values
 * @param {Object} options - Options to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validatePerformanceTestInputs
 */
function validatePerformanceOptions(options, errors) {
  if (options && typeof options !== 'object') {
    errors.push('Options must be an object if provided');
    return;
  }

  validateIterationsOption(options, errors);
  validateScenarioOption(options, errors);
  validateTimeoutOption(options, errors);
}

/**
 * Validate iterations option
 * @purpose Check iterations option value
 * @param {Object} options - Options to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validatePerformanceOptions
 */
function validateIterationsOption(options, errors) {
  if (
    options &&
    options.iterations &&
    (!Number.isInteger(options.iterations) || options.iterations <= 0)
  ) {
    errors.push('Iterations must be a positive integer if provided');
  }
}

/**
 * Validate scenario option
 * @purpose Check scenario option value
 * @param {Object} options - Options to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validatePerformanceOptions
 */
function validateScenarioOption(options, errors) {
  if (options && options.scenario && typeof options.scenario !== 'string') {
    errors.push('Scenario must be a string if provided');
  }
}

/**
 * Validate timeout option
 * @purpose Check timeout option value
 * @param {Object} options - Options to validate
 * @param {Array} errors - Array to collect validation errors
 * @usedBy validatePerformanceOptions
 */
function validateTimeoutOption(options, errors) {
  if (options && options.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
    errors.push('Timeout must be a positive number if provided');
  }
}

// Feature Utilities

/**
 * Check if target is valid for performance testing
 * @purpose Validate target name against known actions and endpoints
 * @param {string} target - Target name to validate
 * @returns {boolean} True if target is valid for performance testing
 * @usedBy validatePerformanceTarget
 */
function isValidPerformanceTarget(target) {
  const validTargets = [
    // Actions
    'get-products',
    'get-products-mesh',
    'browse-files',
    'download-file',
    'delete-file',
    // API Endpoints
    'products',
    'categories',
    'customers',
    'orders',
  ];

  return validTargets.includes(target) || /^[a-zA-Z0-9_-]+$/.test(target);
}

/**
 * Get available performance test scenarios
 * @purpose List all available performance test scenarios
 * @returns {Array} Array of available scenario names
 * @usedBy Test configuration and help utilities
 */
function getAvailableScenarios() {
  return [
    // Basic scenarios
    'quick',
    'thorough',
    'stress',
    'baseline',
    // API-specific baselines
    'rest-baseline',
    'mesh-baseline',
    // Advanced scenarios
    'rest-vs-mesh',
    'mesh-analysis',
    'mesh-concurrent',
    'mesh-batching',
    'mesh-regression',
    'full-stack',
  ];
}

/**
 * Get performance test target suggestions
 * @purpose Provide list of common performance test targets
 * @returns {Array} Array of suggested target names
 * @usedBy Test configuration and help utilities
 */
function getTargetSuggestions() {
  return ['get-products', 'get-products-mesh', 'browse-files', 'products', 'categories'];
}

module.exports = {
  // Business workflows (main exports that actions import)
  executePerformanceTestWorkflow,
  executePerformanceTestWithScenario,

  // Feature operations (coordination functions)
  validatePerformanceTestInputs,
  validatePerformanceTarget,
  validatePerformanceOptions,
  validateIterationsOption,
  validateScenarioOption,
  validateTimeoutOption,

  // Feature utilities (building blocks)
  isValidPerformanceTarget,
  getAvailableScenarios,
  getTargetSuggestions,
};
