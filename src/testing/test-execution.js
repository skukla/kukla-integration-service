/**
 * Testing Execution Utilities
 * Test execution support functions for scripts and test orchestration
 */

const { subInfo } = require('../../scripts/shared/formatting');

// Test Execution Workflows

/**
 * Display test parameter context for debugging
 * @purpose Analyze and display test parameters to help debug test execution
 * @param {Object} testParams - Test parameters being sent to action
 * @returns {void} Outputs parameter analysis to console
 * @usedBy Test scripts, test orchestration workflows
 */
function displayTestParameterContext(testParams) {
  // Step 1: Analyze parameter context
  const paramCount = Object.keys(testParams).length;

  // Step 2: Display parameter summary
  console.log(subInfo(`Parameters: ${paramCount > 0 ? `${paramCount} params` : 'No parameters'}`));

  // Step 3: Display parameter keys for debugging
  if (paramCount > 0) {
    console.log(subInfo(`Param keys: ${Object.keys(testParams).join(', ')}`));
  }

  console.log();
}

/**
 * Analyze test execution context
 * @purpose Provide test execution analysis for debugging and monitoring
 * @param {string} actionName - Action being tested
 * @param {Object} testParams - Parameters being used
 * @param {string} environment - Environment being tested
 * @returns {Object} Test execution context analysis
 * @usedBy Test orchestration, test monitoring
 */
function analyzeTestExecutionContext(actionName, testParams, environment) {
  return {
    actionName,
    environment,
    parameterCount: Object.keys(testParams).length,
    parameterKeys: Object.keys(testParams),
    hasParameters: Object.keys(testParams).length > 0,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  displayTestParameterContext,
  analyzeTestExecutionContext,
};
