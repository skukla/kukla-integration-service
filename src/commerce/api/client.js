/**
 * Commerce API client
 * @module commerce/api/client
 */

const { loadConfig } = require('../../../config');
const { http } = require('../../core');
const { buildCommerceUrl } = require('../../core/routing');

// Load configuration with proper destructuring
const {
  commerce: {
    api: {
      timeout: API_TIMEOUT,
      retry: { attempts: RETRY_ATTEMPTS, delay: RETRY_DELAY },
    },
  },
  url: {
    commerce: { baseUrl: API_BASE_URL, version: API_VERSION },
  },
} = loadConfig();

/**
 * Creates a Commerce API client
 * @param {Object} options - Client options
 * @returns {Object} API client methods
 */
function createClient(options = {}) {
  const clientConfig = {
    baseUrl: options.baseUrl || API_BASE_URL,
    version: options.version || API_VERSION,
    timeout: options.timeout || API_TIMEOUT,
    retry: {
      attempts: options.retry?.attempts || RETRY_ATTEMPTS,
      delay: options.retry?.delay || RETRY_DELAY,
    },
  };

  return {
    /**
     * Makes a request to the Commerce API
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    request: async (endpoint, options = {}) => {
      const requestOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Use buildCommerceUrl to construct the full URL
      const url = buildCommerceUrl(clientConfig.baseUrl, endpoint);

      // Only log URL in development/verbose mode, not during tests
      if (!process.env.QUIET_MODE && process.env.NODE_ENV !== 'test') {
        console.log('Making request to URL:', url);
      }

      // Make the request using the core HTTP client
      const response = await http.request(url, requestOptions);

      // Return the processed response
      return response;
    },

    /**
     * Processes items in batches
     * @param {Array} items - Items to process
     * @param {Function} processor - Processing function
     * @returns {Promise<Array>} Processed results
     */
    processBatch: async (items, processor) => {
      const results = [];
      const batchSize = clientConfig.commerce?.api?.batch?.size || 50; // Default to 50 if not configured
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
      }
      return results;
    },
  };
}

module.exports = {
  createClient,
};
