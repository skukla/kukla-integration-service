/**
 * Performance Testing Workflow
 * Clean orchestration following refactoring standards
 */

const { validation, execution, formatting } = require('../operations');
const { scenarios } = require('../utils');

/**
 * Performance testing workflow - clean orchestrator
 * @param {string} scenarioName - Scenario to test
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Test result
 */
async function performanceTestingWorkflow(scenarioName, options = {}) {
  try {
    // Step 1: Validate inputs
    const validationResult = validation.validatePerformanceTestingInputs(
      scenarioName,
      scenarios.getAvailableScenarios()
    );
    if (validationResult) return validationResult;

    // Step 2: Get scenario details
    const scenario = scenarios.getScenario(scenarioName);

    // Step 3: Execute test
    const testResult = await execution.executePerformanceTest(scenarioName, scenario, options);

    // Step 4: Format response
    return formatting.formatTestResponse(testResult, 'performance', 'performance', scenarioName);
  } catch (error) {
    return {
      success: false,
      scenario: scenarioName,
      error: error.message,
      message: `Performance testing failed: ${error.message}`,
    };
  }
}

module.exports = {
  performanceTestingWorkflow,
};
