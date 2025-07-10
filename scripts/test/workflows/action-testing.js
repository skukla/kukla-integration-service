/**
 * Test Domain - Action Testing Workflow
 * Clean orchestrator pattern following Light DDD principles
 */

const core = require('../../core');
const testOperations = require('../operations');

/**
 * Action testing workflow - Clean orchestrator pattern
 * Single function that orchestrates action testing operations
 * @param {string} actionName - Name of action to test
 * @param {Object} options - Testing options
 * @param {Object} options.params - Action parameters
 * @param {boolean} options.rawOutput - Output raw JSON only
 * @returns {Promise<Object>} Test result
 */
async function actionTestingWorkflow(actionName, options = {}) {
  const { params = {}, rawOutput = false } = options;
  const steps = [];

  try {
    if (rawOutput) {
      // Raw mode: just return response data
      return await testOperations.testExecution.executeRawTest(actionName, params);
    }

    // Step 1: Environment detection and setup - Use shared utility
    const environment = core.handleEnvironmentDetection(params, { silent: rawOutput });
    steps.push(`Successfully detected ${environment} environment`);

    // Step 2: Execute action test with environment context
    const paramsWithEnv = { ...params, NODE_ENV: environment };
    const response = await testOperations.testExecution.executeActionTest(
      actionName,
      paramsWithEnv
    );
    steps.push(`Successfully tested ${actionName} action`);

    // Step 3: Display action info - URL comes from response now
    console.log(core.formatting.url(response.actionUrl));

    // Step 4: Parse response and display additional info
    let responseBody = null;
    if (response.body) {
      try {
        responseBody =
          typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      } catch (error) {
        responseBody = null;
      }
    }

    // Step 5: Display storage information if available
    if (responseBody?.storage) {
      const storageType =
        responseBody.storage.provider === 's3' ? 'Amazon S3' : 'App Builder (Adobe I/O Files)';
      console.log(core.formatting.storage(storageType));
      steps.push(`Successfully stored data using ${storageType}`);
    }

    // Step 6: Display download URL if available
    if (responseBody?.downloadUrl) {
      console.log();
      console.log(core.formatting.downloadUrl(responseBody.downloadUrl));
    }

    // Step 7: Add action-specific steps from response
    if (responseBody?.steps && Array.isArray(responseBody.steps)) {
      steps.push(...responseBody.steps);
    }

    // Determine success/failure
    const isSuccess = response.status >= 200 && response.status < 300;

    // Final status display - consistent with app-deployment pattern
    console.log();
    console.log(core.formatting.status(isSuccess ? 'SUCCESS' : 'ERROR', response.status));
    const message = isSuccess
      ? 'Test completed successfully'
      : `Test failed with status ${response.status}`;
    console.log(core.formatting.section(`Message: ${message}`));

    // Display steps only on success (per user requirements)
    if (isSuccess) {
      console.log();
      console.log(core.formatting.section('Steps:'));
      console.log(core.formatting.steps(steps));
    }

    // Use shared utility for consistent response format
    return core.createWorkflowResponse(isSuccess, environment, steps, isSuccess ? null : message);
  } catch (error) {
    console.log(core.formatting.error(`Action test failed: ${error.message}`));
    return core.createWorkflowResponse(false, null, steps, error.message);
  }
}

module.exports = {
  actionTestingWorkflow,
};
