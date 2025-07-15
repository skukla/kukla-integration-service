/**
 * Test Domain - Test Dispatch Operations
 * Handles routing to appropriate test workflows with proper validation and separation of concerns
 */

const { actionTestingWorkflow } = require('../workflows/action-testing');
const { apiTestingWorkflow } = require('../workflows/api-testing');
const { performanceTestingWorkflow, listScenarios } = require('../workflows/performance-testing');
const { testOrchestrationWorkflow, listTestSuites } = require('../workflows/test-orchestration');

/**
 * Valid test types
 * @constant {Array<string>}
 */
const VALID_TEST_TYPES = ['action', 'api', 'performance', 'perf', 'suite'];

/**
 * Validate test dispatch parameters
 * Pure function that validates input parameters for test dispatch.
 *
 * @param {string} testType - Type of test to run
 * @param {string} target - Target action/endpoint/suite name
 * @param {Object} options - Test options
 * @returns {Object} Validation result
 */
function validateTestParams(testType, target, options = {}) {
  const errors = [];

  if (!testType) {
    errors.push('Test type is required');
  } else if (!VALID_TEST_TYPES.includes(testType)) {
    errors.push(`Invalid test type: ${testType}. Valid types: ${VALID_TEST_TYPES.join(', ')}`);
  }

  if (typeof options !== 'object') {
    errors.push('Options must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Handle list operations for test types
 * Pure operation that executes list functionality based on test type.
 *
 * @param {string} testType - Type of test to list
 * @returns {Object} List operation result
 */
function handleListOperation(testType) {
  switch (testType) {
    case 'performance':
    case 'perf':
      listScenarios();
      return { success: true, listed: true, listType: 'scenarios' };

    case 'suite':
      listTestSuites();
      return { success: true, listed: true, listType: 'suites' };

    default:
      return {
        success: false,
        error: `List operation not supported for test type: ${testType}`,
      };
  }
}

/**
 * Route to action testing workflow
 * Pure routing operation for action testing.
 *
 * @param {string} target - Target action name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function routeToActionTesting(target, options) {
  const { params = {}, rawOutput = false, isProd = false } = options;
  return await actionTestingWorkflow(target, { params, rawOutput, isProd });
}

/**
 * Route to API testing workflow
 * Pure routing operation for API testing.
 *
 * @param {string} target - Target action name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function routeToApiTesting(target, options) {
  const { params = {}, isProd = false } = options;
  const apiAction = target || params.action || 'get-products';
  return await apiTestingWorkflow(apiAction, { params, isProd });
}

/**
 * Route to performance testing workflow
 * Pure routing operation for performance testing.
 *
 * @param {string} target - Target action name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function routeToPerformanceTesting(target, options) {
  const { params = {}, isProd = false } = options;
  const perfAction = target || params.action || 'get-products';
  const scenario = params.scenario || 'quick';
  return await performanceTestingWorkflow(perfAction, scenario, { isProd });
}

/**
 * Route to suite testing workflow
 * Pure routing operation for suite testing.
 *
 * @param {string} target - Target suite name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function routeToSuiteTesting(target, options) {
  const { params = {}, isProd = false, failFast = false } = options;
  const suiteName = target || params.name || 'smoke';
  return await testOrchestrationWorkflow(suiteName, { isProd, failFast });
}

/**
 * Dispatch test execution based on test type
 * Main orchestration function that routes to appropriate test workflows.
 *
 * @param {string} testType - Type of test to run ('action', 'api', 'performance', 'suite')
 * @param {string} target - Target action/endpoint/suite name
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
async function dispatchTest(testType, target, options = {}) {
  // Step 1: Validate input parameters
  const validation = validateTestParams(testType, target, options);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    };
  }

  // Step 2: Handle list operations if requested
  const { list = false } = options;
  if (list) {
    return handleListOperation(testType);
  }

  // Step 3: Route to appropriate test workflow
  try {
    switch (testType) {
      case 'action':
        return await routeToActionTesting(target, options);

      case 'api':
        return await routeToApiTesting(target, options);

      case 'performance':
      case 'perf':
        return await routeToPerformanceTesting(target, options);

      case 'suite':
        return await routeToSuiteTesting(target, options);

      default:
        // This should never happen due to validation, but provide clear error
        return {
          success: false,
          error: `Unsupported test type: ${testType}. Valid types: ${VALID_TEST_TYPES.join(', ')}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Test dispatch failed: ${error.message}`,
    };
  }
}

module.exports = {
  dispatchTest,
  validateTestParams,
  handleListOperation,
  routeToActionTesting,
  routeToApiTesting,
  routeToPerformanceTesting,
  routeToSuiteTesting,
  VALID_TEST_TYPES,
};
