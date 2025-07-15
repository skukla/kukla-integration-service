/**
 * Commerce API Request Operations
 *
 * Mid-level business processes for Commerce API request orchestration.
 * Coordinates request execution with authentication, caching, and error handling.
 */

const { buildCommerceUrl } = require('../../core/routing/operations/commerce');
const { validateAdminCredentials } = require('../utils/admin-auth');
const {
  createAdminTokenRequestFunction,
  createAdminTokenBatchRequestFunction,
  createAdminTokenCachedRequestFunction,
} = require('../utils/request-factories');

/**
 * Executes a single Commerce API request with admin token authentication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} API response
 */
async function executeAdminTokenCommerceRequest(url, options = {}, config, params, trace = null) {
  // Validate admin credentials
  if (!validateAdminCredentials(params)) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  // Create request function
  const requestFn = createAdminTokenRequestFunction(config, params, trace);

  // Build full URL if needed
  const fullUrl = url.startsWith('http') ? url : buildCommerceUrl(config.commerce.baseUrl, url);

  // Track API call if trace context is provided
  if (trace && trace.incrementApiCalls) {
    trace.incrementApiCalls();
  }

  // Execute the request
  return requestFn(fullUrl, options);
}

/**
 * Executes multiple Commerce API requests in batch with admin token authentication
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of API responses
 */
async function executeAdminTokenBatchCommerceRequests(requests, config, params, trace = null) {
  // Validate admin credentials
  if (!validateAdminCredentials(params)) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  // Create batch request function
  const batchRequestFn = createAdminTokenBatchRequestFunction(config, params, trace);

  // Execute batch requests
  return batchRequestFn(requests);
}

/**
 * Executes a cached Commerce API request with admin token authentication
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} API response
 */
async function executeAdminTokenCachedCommerceRequest(
  url,
  options = {},
  config,
  params,
  trace = null
) {
  // Import cache from files domain
  const { MemoryCache } = require('../../files').cache;

  // Validate admin credentials
  if (!validateAdminCredentials(params)) {
    throw new Error(
      'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
    );
  }

  // Create cached request function
  const cachedRequestFn = createAdminTokenCachedRequestFunction(config, params, MemoryCache, trace);

  // Execute the cached request
  return cachedRequestFn(url, options);
}

/**
 * Orchestrates product requests using admin token authentication
 * @param {Object} query - Query parameters for product requests
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Product request result
 */
async function orchestrateProductRequests(query, config, params, trace = null) {
  // Use admin token authentication for product requests
  const url = buildCommerceUrl(config.commerce.baseUrl, '/products');
  return executeAdminTokenCommerceRequest(
    url,
    { method: 'GET', params: query },
    config,
    params,
    trace
  );
}

/**
 * Orchestrates inventory requests using admin token authentication
 * @param {Object} query - Query parameters for inventory requests
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Inventory request result
 */
async function orchestrateInventoryRequests(query, config, params, trace = null) {
  // Use admin token authentication for inventory requests
  const url = buildCommerceUrl(config.commerce.baseUrl, '/stockItems');
  return executeAdminTokenCommerceRequest(
    url,
    { method: 'GET', params: query },
    config,
    params,
    trace
  );
}

/**
 * Orchestrates category requests using admin token authentication
 * @param {Object} query - Query parameters for category requests
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Category request result
 */
async function orchestrateCategoryRequests(query, config, params, trace = null) {
  // Use admin token authentication for category requests
  const url = buildCommerceUrl(config.commerce.baseUrl, '/categories');
  return executeAdminTokenCommerceRequest(
    url,
    { method: 'GET', params: query },
    config,
    params,
    trace
  );
}

/**
 * Orchestrates product enrichment using admin token authentication
 * @param {Object} query - Query parameters for product enrichment
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Product enrichment result
 */
async function orchestrateProductEnrichment(query, config, params, trace = null) {
  // Use admin token authentication for product enrichment
  const productResult = await orchestrateProductRequests(query, config, params, trace);

  // Additional enrichment logic would go here
  return productResult;
}

/**
 * Handles API request errors with enhanced context
 * @param {Error} error - API request error
 * @param {Object} context - Error context
 * @returns {Object} Enhanced error information
 */
function handleApiRequestError(error, context = {}) {
  const { url, method, params } = context;

  return {
    originalError: error,
    apiContext: {
      url: url || 'unknown',
      method: method || 'unknown',
      params: params || {},
      timestamp: new Date().toISOString(),
    },
    enhancedMessage: `API request failed for ${method || 'unknown'} ${url || 'unknown'}: ${error.message}`,
    isRetryable: !error.message.includes('401') && !error.message.includes('Unauthorized'),
    suggestedAction:
      error.message.includes('401') || error.message.includes('Unauthorized')
        ? 'Check admin credentials'
        : 'Retry operation or check network connectivity',
  };
}

module.exports = {
  executeAdminTokenCommerceRequest,
  executeAdminTokenBatchCommerceRequests,
  executeAdminTokenCachedCommerceRequest,
  orchestrateProductRequests,
  orchestrateInventoryRequests,
  orchestrateCategoryRequests,
  orchestrateProductEnrichment,
  handleApiRequestError,
};
