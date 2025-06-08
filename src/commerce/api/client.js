/**
 * Commerce API client
 * @module commerce/api/client
 */

const { loadConfig } = require('../../../config');
const { http } = require('../../core');
const { buildCommerceUrl } = require('../../core/routing');

/**
 * Creates a Commerce API client
 * @param {Object} options - Client options
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} API client methods
 */
function createClient(options = {}, params = {}) {
  const config = loadConfig(params);
  const clientConfig = {
    baseUrl: options.baseUrl || config.commerce.baseUrl,
    version: options.version || config.commerce.version,
    timeout: options.timeout || config.commerce.timeout,
    retry: {
      attempts: options.retry ? options.retry.attempts : config.commerce.retries,
      delay: options.retry ? options.retry.delay : config.commerce.retryDelay,
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

      // Log URL using proper logger if available in params
      if (params.LOG_LEVEL === 'debug' || params.LOG_LEVEL === 'trace') {
        try {
          const { Core } = require('@adobe/aio-sdk');
          const logger = Core.Logger('commerce-client', { level: params.LOG_LEVEL });
          logger.debug('Making Commerce API request', { url });
        } catch (logError) {
          // Ignore logging errors to prevent request from failing
        }
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
      const batchSize = config.commerce.batching.products;
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
