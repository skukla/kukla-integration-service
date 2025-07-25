/**
 * Test Domain - Action Testing Workflow
 * Simplified orchestrator following Light DDD principles with real-time feedback
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { displayProgressResults, buildErrorResult } = require('../operations/response-handling');
const { executeActionTest, executeRawTest } = require('../operations/test-execution');

/**
 * Action testing workflow - Clean orchestrator with immediate feedback
 * @param {string} actionName - Name of action to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @param {boolean} options.isProd - Whether testing in production environment
 * @returns {Promise<Object>} Test result
 */
async function actionTestingWorkflow(actionName, options = {}) {
  const { params = {}, rawOutput = false, isProd = false } = options;

  try {
    if (rawOutput) {
      const result = await executeRawTest(actionName, params, isProd);
      // Output raw JSON to console
      console.log(JSON.stringify(result.rawResponse, null, 2));
      return result;
    }

    // Show immediate feedback
    const environment = getEnvironmentString(isProd);
    console.log(format.success(`Environment detected: ${format.environment(environment)}`));
    console.log(format.success(`Action tested: ${actionName}`));
    console.log();

    // Execute test with progress feedback and display results as they come
    const response = await executeActionTest(actionName, params, isProd);

    // Display final results
    return displayProgressResults(environment, actionName, response);
  } catch (error) {
    // Show error immediately
    console.log(format.error(`Test failed: ${error.message}`));
    return buildErrorResult(error.message, actionName);
  }
}

module.exports = {
  actionTestingWorkflow,
};
