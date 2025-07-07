/**
 * Commerce API Module
 * @module commerce/api
 *
 * Provides Commerce API request functionality with OAuth 1.0 authentication,
 * client management, and batch processing capabilities.
 * Uses functional composition with pure functions and clear input/output contracts.
 */

const { createOAuthHeader } = require('./auth');
const { loadConfig } = require('../../config');
const { http } = require('../shared');
const { buildCommerceUrl } = require('../shared');
const { incrementApiCalls } = require('../shared');

/**
 * Creates a Commerce API client with configuration and request capabilities
 * @param {Object} options - Client options
 * @param {string} [options.baseUrl] - Override base URL
 * @param {string} [options.version] - API version
 * @param {number} [options.timeout] - Request timeout
 * @param {Object} [options.retry] - Retry configuration
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

    /**
     * Gets client configuration
     * @returns {Object} Client configuration
     */
    getConfig: () => ({ ...clientConfig }),
  };
}

/**
 * Makes a Commerce API request with OAuth 1.0 authentication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.headers] - Additional headers
 * @param {Object} [options.body] - Request body
 * @param {Object} params - Request parameters including OAuth credentials
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object>} Response data
 * @throws {Error} When OAuth credentials are missing or request fails
 */
async function makeCommerceRequest(url, options = {}, params = {}, trace = null) {
  const config = loadConfig(params);

  // Let buildCommerceUrl handle the full URL construction
  const fullUrl = url.startsWith('http') ? url : buildCommerceUrl(config.commerce.baseUrl, url);

  // Create OAuth authorization header
  const authHeader = createOAuthHeader(params, options.method || 'GET', fullUrl);

  const client = createClient({}, params);

  // Track API call if trace context is provided
  if (trace) {
    incrementApiCalls(trace);
  }

  return client.request(url, {
    ...options,
    headers: {
      ...http.buildHeaders(),
      Authorization: authHeader,
      ...(options.headers || {}),
    },
  });
}

/**
 * Batches multiple Commerce API requests with OAuth 1.0 authentication
 * @param {Array<Object>} requests - Array of request objects
 * @param {string} requests[].url - Request URL
 * @param {Object} [requests[].options] - Request options
 * @param {Object} params - Request parameters including OAuth credentials
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of responses
 * @throws {Error} When batch processing fails
 */
async function batchCommerceRequests(requests, params = {}, trace = null) {
  const client = createClient({}, params);
  return client.processBatch(requests, async (batch) => {
    return Promise.all(
      batch.map((req) => makeCommerceRequest(req.url, req.options, params, trace))
    );
  });
}

/**
 * Makes a cached Commerce API request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} params - Action parameters for configuration
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object>} Response data
 */
async function makeCachedCommerceRequest(url, options = {}, params = {}, trace = null) {
  const config = loadConfig(params);
  const { MemoryCache } = require('../files').cache;

  const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
  const cached = MemoryCache.get(cacheKey, { ttl: config.commerce.caching.duration });

  if (cached) {
    return cached;
  }

  const response = await makeCommerceRequest(url, options, params, trace);
  MemoryCache.set(cacheKey, response);
  return response;
}

/**
 * Processes an array of API requests with controlled concurrency and retry logic
 * @param {Array} items - Array of items to process with API requests
 * @param {Function} processor - Async function to make API request for each item
 * @param {Object} options - Processing options
 * @param {number} [options.concurrency=3] - Maximum number of concurrent API requests
 * @param {number} [options.retries=2] - Number of retries for failed API requests
 * @param {number} [options.retryDelay=1000] - Delay between retries in milliseconds
 * @returns {Promise<Array>} Array of API response results
 * @throws {Error} When some API requests fail after all retries
 */
async function processConcurrently(items, processor, options = {}) {
  const { concurrency = 3, retries = 2, retryDelay = 1000 } = options;

  const results = [];
  const errors = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item, index) => {
      let lastError;

      // Retry logic for failed API requests
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await processor(item);
          results[i + index] = result;
          return;
        } catch (error) {
          lastError = error;
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // If all retries failed, store the API error
      errors.push({ item, error: lastError });
    });

    // Wait for current batch of API requests to complete
    await Promise.all(batchPromises);
  }

  // If there were any API errors, throw with details
  if (errors.length > 0) {
    const errorMessage = errors
      .map(
        ({ item, error }) => `Failed API request for item ${JSON.stringify(item)}: ${error.message}`
      )
      .join('\n');
    throw new Error(`Some API requests failed:\n${errorMessage}`);
  }

  return results;
}

/**
 * Creates a simple request function for Commerce API endpoints
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Request function configured with auth
 */
function createRequestFunction(params, trace = null) {
  return async (url, options = {}) => {
    return makeCommerceRequest(url, options, params, trace);
  };
}

/**
 * Creates a batch request function for Commerce API endpoints
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Batch request function configured with auth
 */
function createBatchRequestFunction(params, trace = null) {
  return async (requests) => {
    return batchCommerceRequests(requests, params, trace);
  };
}

module.exports = {
  createClient,
  makeCommerceRequest,
  batchCommerceRequests,
  makeCachedCommerceRequest,
  processConcurrently,
  createRequestFunction,
  createBatchRequestFunction,
};
