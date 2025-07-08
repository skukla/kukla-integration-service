/**
 * API tester for performance testing
 * @module core/testing/performance/api-tester
 */

const axios = require('axios');

/**
 * Common metrics calculation
 * @param {Array} startTime Process hrtime start
 * @param {number} startMemory Starting memory usage
 * @param {Object} responseData Response data containing performance metrics
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(startTime, startMemory, responseData) {
  const endTime = process.hrtime(startTime);
  const endMemory = process.memoryUsage().heapUsed;
  const executionTime = endTime[0] + endTime[1] / 1e9; // Convert to seconds
  const memoryUsed = Math.abs(endMemory - startMemory) / 1024 / 1024; // Convert to MB

  // Extract metrics from response
  const { performance } = responseData;

  // Ensure we use the API's memory metrics if available, otherwise use our local measurement
  const memoryMetrics = performance?.memory?.peak
    ? { peak: Math.abs(performance.memory.peak) }
    : { peak: memoryUsed };

  return {
    executionTime,
    memoryUsed,
    performance: {
      ...performance,
      memory: memoryMetrics,
    },
  };
}

/**
 * Build common request parameters
 * @param {Object} auth Authentication details
 * @param {Object} params Additional test parameters
 * @returns {Object} Request parameters
 */
function buildRequestParams(auth, params) {
  return {
    commerce_base_url: auth.commerceUrl,
    commerce_admin_username: auth.commerceAdminUsername,
    commerce_admin_password: auth.commerceAdminPassword,
    format: 'csv',
    env: 'prod',
    ...params,
  };
}

/**
 * Generic API test function
 * @param {Object} apiConfig API configuration
 * @param {string} apiConfig.baseUrl Base URL for API requests
 * @param {string} apiConfig.endpoint API endpoint to test
 * @param {Object} apiConfig.auth Authentication details
 * @param {Object} params Test parameters
 * @param {Object} progressConfig Progress configuration
 * @param {Function} progressConfig.onProgress Progress callback
 * @param {Array<string>} progressConfig.stages Progress stage messages
 * @returns {Promise<Object>} Test results
 */
async function performApiTest(apiConfig, params, progressConfig = {}) {
  const { baseUrl, endpoint, auth } = apiConfig;
  const { onProgress, stages: progressStages } = progressConfig;

  const startTime = process.hrtime();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    // Execute progress stages
    if (onProgress && progressStages) {
      for (const stage of progressStages) {
        await onProgress(stage);
      }
    }

    const response = await axios.get(`${baseUrl}/${endpoint}`, {
      params: buildRequestParams(auth, params),
    });

    if (onProgress) {
      await onProgress('Processing response...');
    }

    const metrics = calculateMetrics(startTime, startMemory, response.data);

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Tests the products API (REST)
 * @param {string} baseUrl Base URL for API requests
 * @param {Object} auth Authentication details
 * @param {Object} params Test parameters
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function testProducts(baseUrl, auth, params, onProgress) {
  const apiConfig = { baseUrl, endpoint: 'get-products', auth };
  const progressConfig = { onProgress, stages: ['Authenticating...', 'Fetching products...'] };
  return performApiTest(apiConfig, params, progressConfig);
}

/**
 * Tests the products API via Mesh
 * @param {string} baseUrl Base URL for API requests
 * @param {Object} auth Authentication details
 * @param {Object} params Test parameters
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function testProductsMesh(baseUrl, auth, params, onProgress) {
  const apiConfig = { baseUrl, endpoint: 'get-products-mesh', auth };
  const progressConfig = {
    onProgress,
    stages: ['Authenticating...', 'Fetching products via mesh...'],
  };
  return performApiTest(apiConfig, params, progressConfig);
}

/**
 * Tests the files API
 * @param {string} baseUrl Base URL for API requests
 * @param {Object} auth Authentication details
 * @param {Object} params Test parameters
 * @param {Function} onProgress Progress callback
 * @returns {Promise<Object>} Test results
 */
async function testFiles(baseUrl, auth, params, onProgress) {
  const apiConfig = { baseUrl, endpoint: 'browse-files', auth };
  const progressConfig = { onProgress, stages: ['Authenticating...', 'Browsing files...'] };
  return performApiTest(apiConfig, params, progressConfig);
}

/**
 * Creates an API tester instance
 * @param {Object} config Configuration object
 * @param {string} config.baseUrl Base URL for API requests
 * @param {Object} config.auth Authentication details
 * @returns {Object} API tester functions
 */
function createApiTester(config) {
  const { baseUrl, auth } = config;

  return {
    testProducts: (params, onProgress) => testProducts(baseUrl, auth, params, onProgress),
    testProductsMesh: (params, onProgress) => testProductsMesh(baseUrl, auth, params, onProgress),
    testFiles: (params, onProgress) => testFiles(baseUrl, auth, params, onProgress),
  };
}

module.exports = createApiTester;
