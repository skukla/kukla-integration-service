/**
 * Test Domain - Test Dispatch Operations
 * Handles routing to appropriate test workflows
 */

const { actionTestingWorkflow } = require('../workflows/action-testing');
const { apiTestingWorkflow } = require('../workflows/api-testing');
const { performanceTestingWorkflow, listScenarios } = require('../workflows/performance-testing');
const { testOrchestrationWorkflow, listTestSuites } = require('../workflows/test-orchestration');

/**
 * Dispatch test execution based on test type
 * @param {string} testType - Type of test to run
 * @param {string} target - Target action/endpoint/suite
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function dispatchTest(testType, target, options = {}) {
  const { params = {}, isProd = false, rawOutput = false, failFast = false } = options;

  switch (testType) {
    case 'api':
      return await apiTestingWorkflow(target, { params, isProd });

    case 'performance':
    case 'perf': {
      if (target === 'list') {
        listScenarios();
        return { success: true, listed: true };
      }
      const scenario = process.argv[4] || 'quick';
      return await performanceTestingWorkflow(target, scenario, { params, isProd });
    }

    case 'suite':
    case 'orchestration': {
      if (target === 'list') {
        listTestSuites();
        return { success: true, listed: true };
      }
      const suiteName = target || 'smoke';
      return await testOrchestrationWorkflow(suiteName, { params, isProd, failFast });
    }

    default: {
      // Default to action testing (backward compatibility)
      const actionName = testType; // First arg is action name for action tests
      return await actionTestingWorkflow(actionName, { params, rawOutput, isProd });
    }
  }
}

module.exports = {
  dispatchTest,
};
