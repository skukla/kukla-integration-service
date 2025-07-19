/**
 * Test Orchestration - Feature Core
 * Complete test orchestration capability with organized sub-modules for different utility categories
 */

// Import from feature sub-modules
const { executeTestSuite } = require('./test-orchestration/parallel-execution');
const {
  aggregateTestResults,
  buildTestOrchestrationResult,
  buildTestOrchestrationErrorResult,
} = require('./test-orchestration/result-aggregation');
const {
  parseTestOrchestrationOptions,
  validateTestOrchestrationPlan,
} = require('./test-orchestration/suite-management');

// Business Workflows

/**
 * Execute comprehensive test orchestration workflow
 * @purpose Orchestrate multiple test types with intelligent routing and result aggregation
 * @param {Object} options - Test orchestration options including commands and targets
 * @returns {Promise<Object>} Complete test orchestration result with aggregated metrics
 * @usedBy scripts/test.js, automated testing pipelines
 * @config testing.orchestration, testing.parallelism
 */
async function executeTestOrchestrationWorkflow(options = {}) {
  try {
    // Step 1: Parse and validate test commands
    const testPlan = parseTestOrchestrationOptions(options);
    const validationResult = validateTestOrchestrationPlan(testPlan);

    if (!validationResult.isValid) {
      return buildTestOrchestrationErrorResult(validationResult.error);
    }

    // Step 2: Execute test suite based on plan
    const executionResult = await executeTestSuite(testPlan);

    // Step 3: Aggregate results and generate comprehensive analysis
    const aggregatedResults = aggregateTestResults(executionResult);

    // Step 4: Build complete orchestration result
    return buildTestOrchestrationResult(testPlan, executionResult, aggregatedResults);
  } catch (error) {
    return buildTestOrchestrationErrorResult(error);
  }
}

/**
 * Execute test orchestration with custom configuration
 * @purpose Run test orchestration with specific test plan configuration
 * @param {Object} customConfig - Custom test configuration
 * @param {Object} options - Additional orchestration options
 * @returns {Promise<Object>} Test orchestration result with custom configuration
 * @usedBy Custom testing workflows, CI/CD pipelines
 */
async function executeTestOrchestrationWithConfig(customConfig, options = {}) {
  const enhancedOptions = { ...options, customConfig };
  return await executeTestOrchestrationWorkflow(enhancedOptions);
}

// Feature Operations

/**
 * Validate test orchestration options
 * @purpose Basic validation of orchestration options before processing
 * @param {Object} options - Options to validate
 * @returns {Object} Validation result with errors and warnings
 * @usedBy executeTestOrchestrationWorkflow
 */
function validateTestOrchestrationOptions(options) {
  const errors = [];
  const warnings = [];

  if (options && typeof options !== 'object') {
    errors.push('Test orchestration options must be an object');
  }

  if (options?.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
    errors.push('Timeout must be a positive number if provided');
  }

  if (options?.parallel && typeof options.parallel !== 'boolean') {
    warnings.push('Parallel option should be a boolean, defaulting to true');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    errors,
    warnings,
  };
}

// Feature Utilities

/**
 * Get available orchestration commands
 * @purpose List all available test orchestration commands
 * @returns {Array} Array of available command names
 * @usedBy Test configuration and help utilities
 */
function getAvailableCommands() {
  return ['action', 'api', 'performance', 'suite', 'auto'];
}

/**
 * Get default test orchestration options
 * @purpose Provide sensible defaults for test orchestration
 * @returns {Object} Default orchestration options
 * @usedBy Test configuration utilities
 */
function getDefaultOrchestrationOptions() {
  return {
    command: 'auto',
    target: 'all',
    suite: null,
    parallel: true,
    timeout: 30000,
    verbose: false,
  };
}

/**
 * Estimate total orchestration time
 * @purpose Provide time estimate for test orchestration execution
 * @param {Object} options - Test orchestration options
 * @returns {number} Estimated execution time in milliseconds
 * @usedBy Test planning utilities
 */
function estimateOrchestrationTime(options) {
  const { parseTestOrchestrationOptions } = require('./test-orchestration/suite-management');
  const { estimateExecutionTime } = require('./test-orchestration/parallel-execution');

  try {
    const testPlan = parseTestOrchestrationOptions(options);
    const tests = testPlan.suiteConfig.tests;

    return estimateExecutionTime(tests, testPlan.parallel);
  } catch (error) {
    // Default estimate for unknown configurations
    return options.timeout || 30000;
  }
}

module.exports = {
  // Business workflows (main exports that actions import)
  executeTestOrchestrationWorkflow,
  executeTestOrchestrationWithConfig,

  // Feature operations (coordination functions)
  validateTestOrchestrationOptions,

  // Feature utilities (building blocks)
  getAvailableCommands,
  getDefaultOrchestrationOptions,
  estimateOrchestrationTime,
};
