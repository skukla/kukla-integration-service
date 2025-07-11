/**
 * Test Orchestration Workflow
 * Simplified orchestrator following Light DDD principles
 */

const format = require('../../core/formatting');
const {
  getAvailableSuites,
  getSuite,
  displayTestSuites,
  executeTestSuite,
  displaySuiteResults,
} = require('../operations/orchestration-operations');

/**
 * List all available test suites
 * @returns {Object} Test suites with descriptions
 */
function listTestSuites() {
  displayTestSuites();
  return getAvailableSuites();
}

/**
 * Test orchestration workflow - Simplified orchestrator
 * @param {string} suiteName - Test suite to run ('smoke', 'regression', 'performance')
 * @param {Object} options - Testing options
 * @param {Object} options.params - Test parameters
 * @param {boolean} options.isProd - Whether testing in production
 * @param {boolean} options.failFast - Stop on first failure
 * @returns {Promise<Object>} Orchestration result
 */
async function testOrchestrationWorkflow(suiteName = 'smoke', options = {}) {
  const { params = {}, isProd = false, failFast = false } = options;
  const environment = isProd ? 'production' : 'staging';

  try {
    // Step 1: Validate suite
    const suite = getSuite(suiteName);
    if (!suite) {
      console.log(format.error(`❌ Invalid test suite: ${suiteName}`));
      console.log(format.section('Available suites:'));
      displayTestSuites();
      return { success: false, error: 'Invalid test suite' };
    }

    // Step 2: Display suite info
    console.log(format.info(`🎭 Test Orchestration: ${suite.name}`));
    console.log(format.section(`Environment: ${format.environment(environment)}`));
    console.log(format.muted(suite.description));
    console.log(
      format.section(`Running ${suite.tests.length} tests${failFast ? ' (fail-fast mode)' : ''}...`)
    );
    console.log();

    // Step 3: Execute test suite
    const suiteResult = await executeTestSuite(suite, { params, isProd, failFast });

    // Step 4: Display results
    displaySuiteResults(suiteResult);

    const { results, passed, failed } = suiteResult;
    const total = results.length;
    const successRate = (passed / total) * 100;
    const overallSuccess = failed === 0;

    return {
      success: overallSuccess,
      suiteName,
      environment,
      stats: {
        total,
        passed,
        failed,
        successRate,
      },
      results,
    };
  } catch (error) {
    console.log(format.error(`Test orchestration failed: ${error.message}`));
    return {
      success: false,
      suiteName,
      environment,
      error: error.message,
    };
  }
}

module.exports = {
  testOrchestrationWorkflow,
  listTestSuites,
};
