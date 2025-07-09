/**
 * API Testing Workflow
 * Clean orchestration following refactoring standards
 */

const { validation, execution, formatting } = require('../operations');
const { endpoints } = require('../utils');

/**
 * API testing workflow - clean orchestrator
 * @param {string} endpoint - Endpoint to test
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Test result
 */
async function apiTestingWorkflow(endpoint, options = {}) {
  const { params = {}, rawOutput = false } = options;

  try {
    // Step 1: Validate inputs
    const validationResult = validation.validateApiTestingInputs(
      endpoint,
      endpoints.getAvailableEndpoints()
    );
    if (validationResult) return validationResult;

    // Step 2: Execute test
    const testResult = await execution.executeApiTest(endpoint, params, rawOutput);

    // Step 3: Format response
    return formatting.formatTestResponse(testResult, 'api', 'api', endpoint);
  } catch (error) {
    return {
      success: false,
      endpoint,
      error: error.message,
      message: `API testing failed: ${error.message}`,
    };
  }
}

module.exports = {
  apiTestingWorkflow,
};
