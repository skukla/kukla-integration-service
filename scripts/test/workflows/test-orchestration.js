/**
 * Scripts Test Orchestration Workflow
 * Integration with testing domain following domain-driven architecture
 */

const { testing } = require('../../../src');

/**
 * Test orchestration workflow using testing domain
 * @param {Object} options - Test options from script framework
 * @returns {Promise<Object>} Test result
 */
async function testOrchestrationWorkflow(options = {}) {
  return await testing.workflows.testOrchestration.testOrchestrationWorkflow(options);
}

module.exports = {
  testOrchestrationWorkflow,
};
