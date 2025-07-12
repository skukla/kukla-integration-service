/**
 * Test Domain - Action Testing Workflow
 * Simplified orchestrator following Light DDD principles
 */

const { getEnvironmentString } = require('../../core/utils/environment');
const { displayTestResults, buildErrorResult } = require('../operations/response-handling');
const { executeActionTest, executeRawTest } = require('../operations/test-execution');

/**
 * Action testing workflow - Clean orchestrator following DDD Light pattern
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
      return await executeRawTest(actionName, params, isProd);
    }

    // Step 1: Delegate everything to operations
    const environment = getEnvironmentString(isProd);
    const response = await executeActionTest(actionName, params, isProd);

    // Step 2: Single operation handles all display logic and returns result
    return displayTestResults(environment, actionName, response);
  } catch (error) {
    // Step 3: Delegate error handling to operations
    return buildErrorResult(error.message, actionName);
  }
}

module.exports = {
  actionTestingWorkflow,
};
