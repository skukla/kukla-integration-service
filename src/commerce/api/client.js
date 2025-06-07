/**
 * Commerce API client
 * @module commerce/api/client
 */

const { http } = require('../../core');
const { createLazyConfigGetter } = require('../../core/config/lazy-loader');
const { buildCommerceUrl } = require('../../core/routing');

/**
 * Lazy configuration getter for Commerce API client
 * @type {Function}
 */
const getCommerceApiConfig = createLazyConfigGetter('commerce-api-config', (config) => ({
  api: {
    timeout: config.commerce?.api?.timeout || 30000,
    retry: {
      attempts: config.commerce?.api?.retry?.attempts || 3,
      delay: config.commerce?.api?.retry?.delay || 1000,
    },
  },
  url: {
    baseUrl: config.url?.commerce?.baseUrl || '',
    version: config.url?.commerce?.version || 'V1',
  },
}));

/**
 * Creates a Commerce API client
 * @param {Object} options - Client options
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} API client methods
 */
function createClient(options = {}, params = {}) {
  const config = getCommerceApiConfig(params);
  const clientConfig = {
    baseUrl: options.baseUrl || config.url.baseUrl,
    version: options.version || config.url.version,
    timeout: options.timeout || config.api.timeout,
    retry: {
      attempts: options.retry?.attempts || config.api.retry.attempts,
      delay: options.retry?.delay || config.api.retry.delay,
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
      const url = buildCommerceUrl(clientConfig.baseUrl, endpoint, {}, params);

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
