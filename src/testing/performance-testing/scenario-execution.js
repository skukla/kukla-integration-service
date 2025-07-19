/**
 * Performance Testing - Scenario Execution Feature Core
 * Complete scenario execution capability with organized sub-modules
 */

// Import from scenario-execution sub-modules
const {
  executeScenarioWithMetrics,
  calculateScenarioMetrics,
  validateScenarioPerformance,
} = require('./scenario-execution/execution');
const { getPerformanceTestScenarios, loadTestScenario } = require('./scenario-execution/scenarios');

// Business Workflows

/**
 * Execute performance test scenario with comprehensive configuration and metrics
 * @purpose Main entry point for performance test scenario execution
 * @param {string} target - Target to test
 * @param {Object} testConfig - Complete test configuration
 * @returns {Promise<Object>} Complete scenario execution result
 * @usedBy executePerformanceTestWorkflow
 */
async function executePerformanceTestScenario(target, testConfig) {
  const { scenario, testFunction, options } = testConfig;

  // Delegate to execution sub-module
  return await executeScenarioWithMetrics(target, scenario, testFunction, options);
}

/**
 * Build performance test configuration
 * @purpose Create complete test configuration from target, scenario, and options
 * @param {string} target - Target to test
 * @param {Object} scenario - Scenario configuration
 * @param {Object} options - Test options
 * @returns {Object} Complete test configuration
 * @usedBy executePerformanceTestWorkflow
 */
function buildPerformanceTestConfig(target, scenario, options) {
  return {
    target,
    scenario,
    testFunction: createTestFunction(target),
    options: {
      verbose: options.verbose || false,
      timeout: options.timeout || scenario.maxExecutionTime,
      ...options,
    },
  };
}

// Feature Operations

/**
 * Create test function for target
 * @purpose Create the actual test function that will be executed
 * @param {string} target - Target to test
 * @returns {Function} Test function to execute
 * @usedBy buildPerformanceTestConfig
 */
function createTestFunction(target) {
  // This would create the appropriate test function based on target type
  // For now, return a placeholder that simulates work
  return async function testFunction() {
    const { sleep } = require('../../shared/utils/async');
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await sleep(delay);
    return { target, executionTime: delay, success: true };
  };
}

/**
 * Validate scenario execution configuration
 * @purpose Validate that scenario and target are compatible
 * @param {string} target - Target to test
 * @param {Object} scenario - Scenario configuration
 * @returns {Object} Validation result
 * @usedBy buildPerformanceTestConfig
 */
function validateScenarioConfiguration(target, scenario) {
  const errors = [];

  if (!target) {
    errors.push('Target is required for scenario execution');
  }

  if (!scenario || !scenario.name) {
    errors.push('Valid scenario configuration is required');
  }

  if (scenario && scenario.iterations && scenario.iterations <= 0) {
    errors.push('Scenario iterations must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Feature Utilities

/**
 * Get available performance test targets
 * @purpose List all valid targets for performance testing
 * @returns {Array} Array of available target names
 * @usedBy Performance test configuration utilities
 */
function getAvailableTargets() {
  return [
    'get-products',
    'get-products-mesh',
    'browse-files',
    'download-file',
    'delete-file',
    'products',
    'categories',
  ];
}

/**
 * Get scenario execution summary
 * @purpose Create summary of scenario execution capabilities
 * @returns {Object} Summary of available scenarios and targets
 * @usedBy Performance test help and configuration utilities
 */
function getScenarioExecutionSummary() {
  const scenarios = getPerformanceTestScenarios();
  const targets = getAvailableTargets();

  return {
    availableScenarios: Object.keys(scenarios),
    availableTargets: targets,
    totalCombinations: Object.keys(scenarios).length * targets.length,
    defaultScenario: 'quick',
    recommendedScenarios: ['quick', 'thorough', 'baseline'],
  };
}

module.exports = {
  // Business workflows (re-exported from sub-modules)
  executePerformanceTestScenario,
  loadTestScenario,
  getPerformanceTestScenarios,

  // Feature operations
  buildPerformanceTestConfig,
  createTestFunction,
  validateScenarioConfiguration,

  // Feature utilities
  getAvailableTargets,
  getScenarioExecutionSummary,

  // Re-exported execution utilities (for backward compatibility)
  executeScenarioWithMetrics,
  calculateScenarioMetrics,
  validateScenarioPerformance,
};
