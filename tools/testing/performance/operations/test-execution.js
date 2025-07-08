/**
 * Test execution operations for performance testing
 * Contains core test execution logic for local and deployed tests
 * @module core/testing/performance/operations/test-execution
 */

const path = require('path');

const createApiTester = require('../api-tester');

/**
 * Executes a test with detailed analysis for mesh actions
 * @param {string} actionName Action to test
 * @param {Object} params Action parameters
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results with optional analysis
 */
async function executeTestWithAnalysis(actionName, params, onProgress) {
  // Import the specific action dynamically
  const actionPath = path.join(process.cwd(), 'actions/backend', actionName);
  const { main } = require(actionPath);

  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    if (onProgress) await onProgress(`Running ${actionName} test...`);

    const result = await main(params);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const basicMetrics = {
      executionTime: endTime - startTime,
      memory: endMemory - startMemory,
      success: !!result,
    };

    // For mesh actions, extract detailed analysis if available
    if (actionName.includes('mesh') && result?.analysis) {
      return {
        ...basicMetrics,
        analysis: result.analysis,
        apiCalls: result.apiCalls || 0,
        breakdown: result.breakdown,
        recommendations: result.recommendations,
      };
    }

    return basicMetrics;
  } catch (error) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      executionTime: endTime - startTime,
      memory: endMemory - startMemory,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Executes a local test
 * @param {Object} scenario Test scenario
 * @param {Object} config Configuration object
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function executeLocalTest(scenario, config, onProgress) {
  const rawParams = {
    __ow_query: { env: 'dev' },
    ...scenario.params,
    LOG_LEVEL: 'info',
    COMMERCE_BASE_URL: process.env.COMMERCE_BASE_URL,
    COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
    COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
    COMMERCE_CONSUMER_KEY: process.env.COMMERCE_CONSUMER_KEY,
    COMMERCE_CONSUMER_SECRET: process.env.COMMERCE_CONSUMER_SECRET,
    COMMERCE_ACCESS_TOKEN: process.env.COMMERCE_ACCESS_TOKEN,
    COMMERCE_ACCESS_TOKEN_SECRET: process.env.COMMERCE_ACCESS_TOKEN_SECRET,
    NODE_ENV: 'staging',
  };

  // Use enhanced testing if analysis is requested
  if (config.includeAnalysis || scenario.analysis) {
    return await executeTestWithAnalysis(scenario.action, rawParams, onProgress);
  }

  // Fallback to original testing for compatibility
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const actionPath = path.join(process.cwd(), 'actions/backend', scenario.action);
    const { main } = require(actionPath);

    if (onProgress) await onProgress('Running local test...');
    await main(rawParams);
  } catch (error) {
    console.warn('Local test error:', error.message);
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    executionTime: endTime - startTime,
    memory: endMemory - startMemory,
  };
}

/**
 * Executes a deployed test
 * @param {Object} scenario Test scenario
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function executeDeployedTest(scenario, onProgress) {
  const apiConfig = {
    deployed: {
      baseUrl: process.env.API_BASE_URL,
      auth: {
        commerceUrl: process.env.COMMERCE_BASE_URL,
        commerceAdminUsername: process.env.COMMERCE_ADMIN_USERNAME,
        commerceAdminPassword: process.env.COMMERCE_ADMIN_PASSWORD,
      },
    },
  };

  const apiTester = createApiTester(apiConfig.deployed);
  const result = await apiTester.testProducts(scenario.params, onProgress);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.metrics;
}

module.exports = {
  executeTestWithAnalysis,
  executeLocalTest,
  executeDeployedTest,
};
