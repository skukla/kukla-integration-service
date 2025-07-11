/**
 * Test Domain - Action Testing Workflow
 * Simplified orchestrator following Light DDD principles
 */

const format = require('../../core/formatting');
const { getEnvironmentString } = require('../../core/utils/environment');
const { isSuccessfulResponse, displayResponseData } = require('../operations');
const { executeActionTest, executeRawTest } = require('../operations/test-execution');

/**
 * Action testing workflow - Simplified orchestrator
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

    // Step 1: Environment setup
    const environment = getEnvironmentString(isProd);

    // Step 2: Execute action test
    const response = await executeActionTest(actionName, params, isProd);

    // Step 3: Display URL and status
    console.log(format.url(response.actionUrl));
    console.log();

    // Step 4: Use domain-specific success logic
    const isSuccess = isSuccessfulResponse(response);
    console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));

    const message = isSuccess
      ? 'Test completed successfully'
      : `Test failed with status ${response.status}`;
    console.log(format.section(`Message: ${message}`));

    // Use domain-specific display logic
    displayResponseData(response, isSuccess);

    return {
      success: isSuccess,
      environment,
      actionName,
      status: response.status,
      message: isSuccess ? null : message,
    };
  } catch (error) {
    console.log(format.error(`Action test failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      actionName,
    };
  }
}

module.exports = {
  actionTestingWorkflow,
};
