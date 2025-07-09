/**
 * Scripts Performance Testing Workflow
 * Integration with testing domain following domain-driven architecture
 */

const { testing } = require('../../../src');

/**
 * Get available performance test scenarios
 * @returns {Array<string>} Available scenario names
 */
function getAvailableScenarios() {
  return testing.utils.scenarios.getAvailableScenarios();
}

/**
 * Get scenario details by name
 * @param {string} scenarioName - Scenario name
 * @returns {Object|null} Scenario details or null if not found
 */
function getScenario(scenarioName) {
  return testing.utils.scenarios.getScenario(scenarioName);
}

/**
 * List all available scenarios with descriptions
 * @returns {Object} Scenarios with descriptions
 */
function listScenarios() {
  return testing.utils.scenarios.listScenarios();
}

/**
 * Performance testing workflow using testing domain
 * @param {string} scenarioName - Scenario to test
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Test result
 */
async function performanceTestingWorkflow(scenarioName, options = {}) {
  return await testing.workflows.performanceTesting.performanceTestingWorkflow(
    scenarioName,
    options
  );
}

module.exports = {
  performanceTestingWorkflow,
  getAvailableScenarios,
  getScenario,
  listScenarios,
};
