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
 * @param {string} testType - Type of test to run ('action', 'api', 'performance', 'suite')
 * @param {string} target - Target action/endpoint/suite name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function dispatchTest(testType, target, options = {}) {
  const {
    params = {},
    isProd = false,
    rawOutput = false,
    failFast = false,
    list = false,
  } = options;

  switch (testType) {
    case 'action':
      // Action testing - standardized --action format
      return await actionTestingWorkflow(target, { params, rawOutput, isProd });

    case 'api': {
      // API testing - standardized --type=api --action format
      const apiAction = target || params.action || 'get-products';
      return await apiTestingWorkflow(apiAction, { params, isProd });
    }

    case 'performance':
    case 'perf': {
      // Performance testing - standardized --type=performance format
      if (list) {
        listScenarios();
        return { listed: true };
      }

      const perfAction = target || params.action || 'get-products';
      const scenario = params.scenario || 'quick';
      return await performanceTestingWorkflow(perfAction, scenario, { isProd });
    }

    case 'suite': {
      // Suite testing - standardized --type=suite format
      if (list) {
        listTestSuites();
        return { listed: true };
      }

      const suiteName = target || params.name || 'smoke';
      return await testOrchestrationWorkflow(suiteName, { isProd, failFast });
    }

    default: {
      // Fallback for legacy positional arguments or unknown test types
      if (testType && !['action', 'api', 'performance', 'perf', 'suite'].includes(testType)) {
        // Treat unknown testType as action name for backward compatibility
        return await actionTestingWorkflow(testType, { params, rawOutput, isProd });
      }

      throw new Error(`Unknown test type: ${testType}`);
    }
  }
}

module.exports = {
  dispatchTest,
};
