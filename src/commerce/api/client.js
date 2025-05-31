/**
 * Commerce API client
 * @module commerce/api/client
 */

const config = require('../../../config');
const { http } = require('../../core');

/**
 * Creates a configured commerce API client
 * @returns {Object} Commerce API client
 */
function createClient() {
  // Load configuration when creating client
  const { commerce, security } = config.loadConfig();

  return {
    request: async (endpoint, options = {}) => {
      const requestOptions = {
        ...options,
        timeout: commerce.api.timeout,
        retry: {
          attempts: commerce.api.retry.attempts,
          delay: commerce.api.retry.delay,
        },
      };

      // Add authentication
      if (security.authentication.commerce.type === 'basic') {
        requestOptions.auth = {
          username: security.authentication.commerce.credentials.username,
          password: security.authentication.commerce.credentials.password,
        };
      } else if (security.authentication.commerce.type === 'token') {
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `Bearer ${security.authentication.commerce.credentials.token}`,
        };
      }

      // Add caching for GET requests
      if (options.method === 'GET' && commerce.api.cache.duration > 0) {
        requestOptions.cache = {
          duration: commerce.api.cache.duration,
        };
      }

      // Normalize base URL and endpoint
      const baseUrl = commerce.api.baseUrl.replace(/\/$/, '');
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${baseUrl}${normalizedEndpoint}`;

      return http.request(url, requestOptions);
    },

    /**
     * Processes items in batches
     * @param {Array} items - Items to process
     * @param {Function} processor - Processing function
     * @returns {Promise<Array>} Processed results
     */
    processBatch: async (items, processor) => {
      const results = [];
      for (let i = 0; i < items.length; i += commerce.api.batch.size) {
        const batch = items.slice(i, i + commerce.api.batch.size);
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
