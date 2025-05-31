/**
 * API tester for performance testing
 * @module core/testing/performance/api-tester
 */

const axios = require('axios');

/**
 * Creates an API tester instance
 * @param {Object} config Configuration object
 * @param {string} config.baseUrl Base URL for API requests
 * @param {Object} config.auth Authentication details
 * @returns {Object} API tester functions
 */
function createApiTester(config) {
  const { baseUrl, auth } = config;

  /**
   * Tests the products API
   * @param {Object} params Test parameters
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function testProducts(params, onProgress) {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      if (onProgress) {
        await onProgress('Authenticating...');
      }

      if (onProgress) {
        await onProgress('Fetching products...');
      }

      const response = await axios.get(`${baseUrl}/get-products`, {
        params: {
          commerce_url: auth.commerceUrl,
          commerce_admin_username: auth.commerceAdminUsername,
          commerce_admin_password: auth.commerceAdminPassword,
          format: 'csv',
          env: 'prod',
          ...params,
        },
      });

      if (onProgress) {
        await onProgress('Processing response...');
      }

      const endTime = process.hrtime(startTime);
      const endMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime[0] + endTime[1] / 1e9; // Convert to seconds
      const memoryUsed = Math.abs(endMemory - startMemory) / 1024 / 1024; // Convert to MB

      // Extract metrics from response
      const { performance } = response.data;

      // Ensure we use the API's memory metrics if available, otherwise use our local measurement
      const memoryMetrics = performance?.memory?.peak
        ? { peak: Math.abs(performance.memory.peak) }
        : { peak: memoryUsed };

      return {
        success: true,
        metrics: {
          executionTime,
          memoryUsed,
          performance: {
            ...performance,
            memory: memoryMetrics,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Tests the files API
   * @param {Object} params Test parameters
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function testFiles(params, onProgress) {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      if (onProgress) {
        await onProgress('Authenticating...');
      }

      if (onProgress) {
        await onProgress('Browsing files...');
      }

      const response = await axios.get(`${baseUrl}/browse-files`, {
        params: {
          commerce_url: auth.commerceUrl,
          commerce_admin_username: auth.commerceAdminUsername,
          commerce_admin_password: auth.commerceAdminPassword,
          ...params,
        },
      });

      if (onProgress) {
        await onProgress('Processing response...');
      }

      const endTime = process.hrtime(startTime);
      const endMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime[0] + endTime[1] / 1e9;
      const memoryUsed = Math.abs(endMemory - startMemory) / 1024 / 1024;

      return {
        success: true,
        metrics: {
          executionTime,
          memoryUsed,
          performance: response.data.performance || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  return {
    testProducts,
    testFiles,
  };
}

module.exports = createApiTester;
