/**
 * Commerce Request Factory Utilities
 *
 * Low-level pure functions for creating Commerce API clients and request configurations.
 * Contains factory functions for building request handlers with authentication.
 */

const { createOAuthHeader } = require('./oauth');
const { http } = require('../../core');
const { buildCommerceUrl } = require('../../core');

/**
 * Creates a Commerce API client configuration
 * @param {Object} config - Configuration object
 * @param {Object} options - Client options
 * @param {string} [options.baseUrl] - Base URL override
 * @param {string} [options.version] - API version
 * @param {number} [options.timeout] - Request timeout
 * @param {Object} [options.retry] - Retry configuration
 * @returns {Object} Client configuration object
 */
function createClientConfig(config, options = {}) {
  return {
    baseUrl: options.baseUrl || config.commerce.baseUrl,
    version: options.version || config.commerce.version,
    timeout: options.timeout || config.performance.timeouts.api.commerce,
    retry: {
      attempts: options.retry
        ? options.retry.attempts
        : config.performance.retries.api.commerce.attempts,
      delay: options.retry ? options.retry.delay : config.performance.retries.api.commerce.delay,
    },
  };
}

/**
 * Creates request headers with OAuth authentication
 * @param {Object} params - Action parameters containing OAuth credentials
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} [additionalHeaders] - Additional headers to include
 * @returns {Object} Complete request headers
 */
function createAuthenticatedHeaders(params, method, url, additionalHeaders = {}) {
  const authHeader = createOAuthHeader(params, method, url);

  return {
    ...http.buildHeaders(),
    'Content-Type': 'application/json',
    Authorization: authHeader,
    ...additionalHeaders,
  };
}

/**
 * Creates a request options object
 * @param {Object} config - Client configuration
 * @param {Object} params - Action parameters
 * @param {Object} options - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.headers] - Additional headers
 * @param {Object} [options.body] - Request body
 * @returns {Object} Complete request options
 */
function createRequestOptions(config, params, options = {}) {
  const method = options.method || 'GET';
  const url = options.url || '';

  return {
    ...options,
    method,
    headers: createAuthenticatedHeaders(params, method, url, options.headers),
    timeout: config.timeout,
  };
}

/**
 * Creates a batch processor function
 * @param {Object} config - Configuration object
 * @param {Function} processor - Processing function for each batch
 * @returns {Function} Batch processor function
 */
function createBatchProcessor(config, processor) {
  return async (items) => {
    const results = [];
    const batchSize = config.commerce.batching.products;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }

    return results;
  };
}

/**
 * Creates a concurrency processor with retry logic
 * @param {Object} options - Processing options
 * @param {number} [options.concurrency=3] - Maximum concurrent requests
 * @param {number} [options.retries=2] - Number of retries
 * @param {number} [options.retryDelay=1000] - Delay between retries
 * @returns {Function} Concurrency processor function
 */
function createConcurrencyProcessor(options = {}) {
  const { concurrency = 3, retries = 2, retryDelay = 1000 } = options;

  return async (items, processor) => {
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

        // If all retries failed, store the error
        errors.push({ item, error: lastError });
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);
    }

    // If there were errors, throw with details
    if (errors.length > 0) {
      const errorMessage = errors
        .map(
          ({ item, error }) => `Failed request for item ${JSON.stringify(item)}: ${error.message}`
        )
        .join('\n');
      throw new Error(`Some requests failed:\n${errorMessage}`);
    }

    return results;
  };
}

/**
 * Creates a request function factory configured with authentication
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Request function
 */
function createRequestFunction(config, params, trace = null) {
  const clientConfig = createClientConfig(config);

  return async (url, options = {}) => {
    // Build full URL if needed
    const fullUrl = url.startsWith('http') ? url : buildCommerceUrl(config.commerce.baseUrl, url);

    // Create request options with authentication
    const requestOptions = createRequestOptions(clientConfig, params, {
      ...options,
      url: fullUrl,
    });

    // Track API call if trace context is provided
    if (trace && trace.incrementApiCalls) {
      trace.incrementApiCalls();
    }

    // Log URL for debugging
    if (params.LOG_LEVEL === 'debug' || params.LOG_LEVEL === 'trace') {
      try {
        const { Core } = require('@adobe/aio-sdk');
        const logger = Core.Logger('commerce-client', { level: params.LOG_LEVEL });
        logger.debug('Making Commerce API request', { url: fullUrl });
      } catch (logError) {
        // Ignore logging errors to prevent request from failing
      }
    }

    // Make the request using the core HTTP client
    return http.request(fullUrl, requestOptions);
  };
}

/**
 * Creates a batch request function factory
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Batch request function
 */
function createBatchRequestFunction(config, params, trace = null) {
  const requestFunction = createRequestFunction(config, params, trace);
  const batchProcessor = createBatchProcessor(config, async (batch) => {
    return Promise.all(batch.map((req) => requestFunction(req.url, req.options)));
  });

  return async (requests) => {
    return batchProcessor(requests);
  };
}

/**
 * Creates a cached request function factory
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} cache - Cache instance
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Cached request function
 */
function createCachedRequestFunction(config, params, cache, trace = null) {
  const requestFunction = createRequestFunction(config, params, trace);

  return async (url, options = {}) => {
    const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey, { ttl: config.commerce.caching.duration });

    if (cached) {
      return cached;
    }

    const response = await requestFunction(url, options);
    cache.set(cacheKey, response);
    return response;
  };
}

module.exports = {
  createClientConfig,
  createAuthenticatedHeaders,
  createRequestOptions,
  createBatchProcessor,
  createConcurrencyProcessor,
  createRequestFunction,
  createBatchRequestFunction,
  createCachedRequestFunction,
};
