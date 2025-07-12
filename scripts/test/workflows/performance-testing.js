/**
 * Performance Testing Workflow
 * Simplified orchestrator following Light DDD principles
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const {
  getAvailableScenarios,
  getScenario,
  displayScenarios,
  executeBatchedPerformanceTest,
  calculatePerformanceStats,
  displayPerformanceResults,
} = require('../operations/performance-operations');
const { buildActionUrl } = require('../operations/url-building');

/**
 * List all available scenarios with descriptions
 * @returns {Object} Scenarios with descriptions
 */
function listScenarios() {
  displayScenarios();
  return getAvailableScenarios();
}

/**
 * Performance testing workflow - Simplified orchestrator
 * @param {string} scenarioOrAction - Scenario name or action name
 * @param {string} scenarioName - Performance scenario name (optional)
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.isProd - Whether testing in production
 * @returns {Promise<Object>} Performance test result
 */
async function performanceTestingWorkflow(scenarioOrAction, scenarioName = null, options = {}) {
  const { params = {}, isProd = false } = options;
  const environment = getEnvironmentString(isProd);

  // Determine if first param is a scenario or action name
  const availableScenarios = getAvailableScenarios();
  const isScenario = Object.keys(availableScenarios).includes(scenarioOrAction);

  const actionName = isScenario ? 'get-products' : scenarioOrAction; // Default to get-products for scenarios
  const scenario = isScenario ? scenarioOrAction : scenarioName || 'quick';

  try {
    // Step 1: Validate scenario
    const scenarioData = getScenario(scenario);
    if (!scenarioData) {
      console.log(format.error(`❌ Invalid scenario: ${scenario}`));
      console.log(format.section('Available scenarios:'));
      displayScenarios();
      return { success: false, error: 'Invalid scenario' };
    }

    // Step 2: Display test info (aligned with action/API testing format)
    console.log(format.success(`Environment detected: ${format.environment(environment)}`));
    console.log(format.success(`Performance test: ${actionName} (${scenario})`));
    console.log();

    console.log(format.section(`Scenario: ${scenarioData.name}`));
    console.log(format.muted(scenarioData.description));
    console.log();

    // Step 3: Display test URL
    const apiUrl = buildActionUrl(actionName, params, isProd);
    console.log(format.url(apiUrl));
    console.log();

    // Step 4: Execute performance test
    console.log(
      format.info(
        `⏱️  Running ${scenarioData.requests} requests with ${scenarioData.concurrency} concurrency...`
      )
    );
    const results = await executeBatchedPerformanceTest(actionName, scenarioData, params, isProd);

    // Step 5: Calculate and display results
    const stats = calculatePerformanceStats(results);
    displayPerformanceResults(stats);

    return {
      success: stats.successRate > 80, // Consider 80%+ success rate as passing
      actionName,
      scenario: scenario,
      environment,
      stats,
      results,
    };
  } catch (error) {
    console.log(format.error(`Performance test failed: ${error.message}`));
    return {
      success: false,
      actionName,
      scenario: scenario,
      environment,
      error: error.message,
    };
  }
}

module.exports = {
  performanceTestingWorkflow,
  getAvailableScenarios,
  listScenarios,
};
