/**
 * Commerce Request Factory Utilities
 *
 * Low-level pure functions for creating Commerce API clients and request configurations.
 * Contains factory functions for building request handlers with admin token authentication.
 */

const { getAuthToken } = require('./admin-auth');
const { http } = require('../../core');
const { buildCommerceUrl } = require('../../core');

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Extracts commerce configuration with validation
 * @param {Object} config - Configuration object
 * @returns {Object} Commerce configuration
 */
function extractCommerceConfig(config) {
  if (!config?.commerce?.baseUrl) {
    throw new Error('Commerce base URL not configured');
  }

  return {
    baseUrl: config.commerce.baseUrl,
    version: config.commerce.version || 'V1',
    timeout: config.performance?.timeouts?.api?.commerce || 30000,
    retry: {
      attempts: config.performance?.retries?.api?.commerce?.attempts || 3,
      delay: config.performance?.retries?.api?.commerce?.delay || 1000,
    },
  };
}

/**
 * Extracts performance configuration with validation
 * @param {Object} config - Configuration object
 * @returns {Object} Performance configuration
 */
function extractPerformanceConfig(config) {
  return {
    maxConcurrency: config.performance?.batching?.maxConcurrent || 5,
    requestDelay: config.performance?.batching?.requestDelay || 100,
    batchSize: config.commerce?.batching?.products || 50,
    caching: {
      duration: config.commerce?.caching?.duration || 300000, // 5 minutes
    },
  };
}

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates request headers with admin token authentication
 * @param {string} adminToken - Admin bearer token
 * @param {Object} [additionalHeaders] - Additional headers to include
 * @returns {Object} Complete request headers
 */
function createAdminTokenHeaders(adminToken, additionalHeaders = {}) {
  if (!adminToken) {
    throw new Error('Admin token is required for authentication');
  }

  return {
    ...http.buildHeaders(),
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
    ...additionalHeaders,
  };
}

/**
 * Creates request options with admin token authentication
 * @param {Object} clientConfig - Client configuration
 * @param {string} adminToken - Admin bearer token
 * @param {Object} options - Request options
 * @returns {Object} Complete request options
 */
function createRequestOptions(clientConfig, adminToken, options = {}) {
  const method = options.method || 'GET';

  return {
    ...options,
    method,
    headers: createAdminTokenHeaders(adminToken, options.headers),
    timeout: clientConfig.timeout,
  };
}

/**
 * Builds full URL from base URL and path
 * @param {string} baseUrl - Commerce base URL
 * @param {string} url - Request URL or path
 * @returns {string} Full URL
 */
function buildFullUrl(baseUrl, url) {
  if (url.startsWith('http')) {
    return url;
  }
  return buildCommerceUrl(baseUrl, url);
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Creates a token manager with caching
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} [trace] - Optional trace context
 * @returns {Object} Token manager
 */
function createTokenManager(params, config, trace = null) {
  let cachedToken = null;
  let tokenPromise = null;

  return {
    async getToken() {
      // Return cached token if available
      if (cachedToken) {
        return cachedToken;
      }

      // If token generation is in progress, wait for it
      if (tokenPromise) {
        return tokenPromise;
      }

      // Generate new token
      tokenPromise = getAuthToken(params, config, trace);

      try {
        cachedToken = await tokenPromise;
        return cachedToken;
      } catch (error) {
        // Clear promise on error so next call will retry
        tokenPromise = null;
        throw error;
      } finally {
        // Clear promise once resolved
        tokenPromise = null;
      }
    },

    clearToken() {
      cachedToken = null;
      tokenPromise = null;
    },
  };
}

// ============================================================================
// TRACING UTILITIES
// ============================================================================

/**
 * Increments API call count in trace context
 * @param {Object} [trace] - Optional trace context
 */
function incrementApiCall(trace) {
  if (trace && trace.incrementApiCalls) {
    trace.incrementApiCalls();
  }
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Logs API request for debugging
 * @param {Object} params - Action parameters
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 */
function logApiRequest(params, url, method = 'GET') {
  if (params.LOG_LEVEL === 'debug' || params.LOG_LEVEL === 'trace') {
    try {
      const { Core } = require('@adobe/aio-sdk');
      const logger = Core.Logger('commerce-client', { level: params.LOG_LEVEL });
      logger.debug('Making Commerce API request with admin token', {
        url,
        method,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      // Ignore logging errors to prevent request from failing
    }
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Checks if error is an authentication error
 * @param {Error} error - Error to check
 * @returns {boolean} True if authentication error
 */
function isAuthenticationError(error) {
  return (
    error.message.includes('401') ||
    error.message.includes('Unauthorized') ||
    error.message.includes('Authentication failed')
  );
}

/**
 * Handles authentication errors with token refresh
 * @param {Error} error - Original error
 * @param {Object} tokenManager - Token manager
 * @param {Function} retryFn - Function to retry
 * @returns {Promise} Retry result
 */
async function handleAuthError(error, tokenManager, retryFn) {
  if (!isAuthenticationError(error)) {
    throw error;
  }

  // Clear cached token and retry once
  tokenManager.clearToken();
  return retryFn();
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Creates a batch processor function
 * @param {Object} performanceConfig - Performance configuration
 * @returns {Function} Batch processor function
 */
function createBatchProcessor(performanceConfig) {
  return async (items, processor) => {
    const results = [];
    const { batchSize } = performanceConfig;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }

    return results;
  };
}

/**
 * Creates a concurrency processor with configurable limits
 * @param {Object} performanceConfig - Performance configuration
 * @returns {Function} Concurrency processor function
 */
function createConcurrencyProcessor(performanceConfig) {
  const { maxConcurrency, requestDelay } = performanceConfig;

  return async (items, processor) => {
    const results = [];

    for (let i = 0; i < items.length; i += maxConcurrency) {
      const batch = items.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + maxConcurrency < items.length) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }

    return results;
  };
}

// ============================================================================
// MAIN FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a request function with admin token authentication
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Request function
 */
function createAdminTokenRequestFunction(config, params, trace = null) {
  const commerceConfig = extractCommerceConfig(config);
  const tokenManager = createTokenManager(params, config, trace);

  return async (url, options = {}) => {
    const fullUrl = buildFullUrl(commerceConfig.baseUrl, url);
    const method = options.method || 'GET';

    // Log request for debugging
    logApiRequest(params, fullUrl, method);

    // Track API call
    incrementApiCall(trace);

    const makeRequest = async () => {
      const token = await tokenManager.getToken();
      const requestOptions = createRequestOptions(commerceConfig, token, {
        ...options,
        url: fullUrl,
      });

      return http.request(fullUrl, requestOptions);
    };

    try {
      return await makeRequest();
    } catch (error) {
      // Handle auth errors with token refresh
      return handleAuthError(error, tokenManager, makeRequest);
    }
  };
}

/**
 * Creates a batch request function with admin token authentication
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Batch request function
 */
function createAdminTokenBatchRequestFunction(config, params, trace = null) {
  const performanceConfig = extractPerformanceConfig(config);
  const requestFunction = createAdminTokenRequestFunction(config, params, trace);
  const concurrencyProcessor = createConcurrencyProcessor(performanceConfig);

  return async (requests) => {
    return concurrencyProcessor(requests, async (request) => {
      const { url, options } = request;
      return requestFunction(url, options);
    });
  };
}

/**
 * Creates a cached request function with admin token authentication
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} cache - Cache instance
 * @param {Object} [trace] - Optional trace context
 * @returns {Function} Cached request function
 */
function createAdminTokenCachedRequestFunction(config, params, cache, trace = null) {
  const performanceConfig = extractPerformanceConfig(config);
  const requestFunction = createAdminTokenRequestFunction(config, params, trace);

  return async (url, options = {}) => {
    const cacheKey = `commerce:admin-request:${url}:${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey, { ttl: performanceConfig.caching.duration });

    if (cached) {
      return cached;
    }

    const response = await requestFunction(url, options);
    cache.set(cacheKey, response);
    return response;
  };
}

module.exports = {
  // Main factory functions
  createAdminTokenRequestFunction,
  createAdminTokenBatchRequestFunction,
  createAdminTokenCachedRequestFunction,

  // Utility functions
  createAdminTokenHeaders,
  createBatchProcessor,
  createConcurrencyProcessor,

  // Configuration utilities
  extractCommerceConfig,
  extractPerformanceConfig,
};
