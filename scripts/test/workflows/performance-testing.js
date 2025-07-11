/**
 * Performance Testing Workflow
 * Simplified orchestrator following Light DDD principles
 */

const format = require('../../core/formatting');
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
 * @param {string} actionName - Action to test
 * @param {string} scenarioName - Performance scenario name
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.isProd - Whether testing in production
 * @returns {Promise<Object>} Performance test result
 */
async function performanceTestingWorkflow(actionName, scenarioName = 'quick', options = {}) {
  const { params = {}, isProd = false } = options;
  const environment = isProd ? 'production' : 'staging';

  try {
    // Step 1: Validate scenario
    const scenario = getScenario(scenarioName);
    if (!scenario) {
      console.log(format.error(`❌ Invalid scenario: ${scenarioName}`));
      console.log(format.section('Available scenarios:'));
      displayScenarios();
      return { success: false, error: 'Invalid scenario' };
    }

    // Step 2: Display test info
    console.log(format.info(`🚀 Performance Testing: ${actionName}`));
    console.log(format.section(`Scenario: ${scenario.name}`));
    console.log(format.section(`Environment: ${format.environment(environment)}`));
    console.log(format.muted(scenario.description));
    console.log();

    // Step 3: Display test URL
    const apiUrl = buildActionUrl(actionName, params, isProd);
    console.log(format.url(apiUrl));
    console.log();

    // Step 4: Execute performance test
    console.log(
      format.info(
        `⏱️  Running ${scenario.requests} requests with ${scenario.concurrency} concurrency...`
      )
    );
    const results = await executeBatchedPerformanceTest(actionName, scenario, params, isProd);

    // Step 5: Calculate and display results
    const stats = calculatePerformanceStats(results);
    displayPerformanceResults(stats);

    return {
      success: stats.successRate > 80, // Consider 80%+ success rate as passing
      actionName,
      scenario: scenarioName,
      environment,
      stats,
      results,
    };
  } catch (error) {
    console.log(format.error(`Performance test failed: ${error.message}`));
    return {
      success: false,
      actionName,
      scenario: scenarioName,
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
