/**
 * Scripts API Testing Workflow
 * Integration with testing domain following domain-driven architecture
 */

const { testing } = require('../../../src');

/**
 * Get available API endpoints for testing
 * @returns {Array<string>} Available endpoints
 */
function getAvailableEndpoints() {
  return testing.utils.endpoints.getAvailableEndpoints();
}

/**
 * API testing workflow using testing domain
 * @param {string} endpoint - Endpoint to test
 * @param {Object} options - Testing options
 * @returns {Promise<Object>} Test result
 */
async function apiTestingWorkflow(endpoint, options = {}) {
  return await testing.workflows.apiTesting.apiTestingWorkflow(endpoint, options);
}

module.exports = {
  apiTestingWorkflow,
  getAvailableEndpoints,
};
