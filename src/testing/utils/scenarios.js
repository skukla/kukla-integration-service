/**
 * Testing Scenarios Utility
 * Performance testing scenarios management
 */

const scenarios = require('../../../tools/testing/performance/scenarios');

/**
 * Get available performance test scenarios
 * @returns {Array<string>} Available scenario names
 */
function getAvailableScenarios() {
  return Object.keys(scenarios);
}

/**
 * Get scenario details by name
 * @param {string} scenarioName - Scenario name
 * @returns {Object|null} Scenario details or null if not found
 */
function getScenario(scenarioName) {
  return scenarios[scenarioName] || null;
}

/**
 * List all available scenarios with descriptions
 * @returns {Object} Scenarios with descriptions
 */
function listScenarios() {
  const scenarioList = {};

  Object.entries(scenarios).forEach(([name, scenario]) => {
    scenarioList[name] = {
      name: scenario.name,
      description: scenario.description,
      type: scenario.actions
        ? 'comparative'
        : scenario.variants
          ? 'optimization'
          : scenario.concurrency
            ? 'load'
            : 'standard',
    };
  });

  return scenarioList;
}

module.exports = {
  getAvailableScenarios,
  getScenario,
  listScenarios,
};
