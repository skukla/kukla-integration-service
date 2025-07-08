/**
 * Commerce API Request Operations
 *
 * Mid-level business processes for Commerce API request orchestration.
 * Coordinates request execution with authentication, caching, and error handling.
 */

const { createAuthenticationContext } = require('./authentication');
const { buildCommerceUrl } = require('../../core');
const {
  createRequestFunction,
  createBatchRequestFunction,
  createCachedRequestFunction,
} = require('../utils/request-factories');

/**
 * Executes a single Commerce API request with full orchestration
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} API response
 */
async function executeCommerceRequest(url, options = {}, config, params, trace = null) {
  // Validate authentication context
  createAuthenticationContext(params, config);

  // Create request function
  const requestFn = createRequestFunction(config, params, trace);

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
 * Executes multiple Commerce API requests in batch
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of API responses
 */
async function executeBatchCommerceRequests(requests, config, params, trace = null) {
  // Validate authentication context
  createAuthenticationContext(params, config);

  // Create batch request function
  const batchRequestFn = createBatchRequestFunction(config, params, trace);

  // Execute batch requests
  return batchRequestFn(requests);
}

/**
 * Executes a cached Commerce API request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} API response
 */
async function executeCachedCommerceRequest(url, options = {}, config, params, trace = null) {
  // Import cache from files domain
  const { MemoryCache } = require('../../files').cache;

  // Validate authentication context
  createAuthenticationContext(params, config);

  // Create cached request function
  const cachedRequestFn = createCachedRequestFunction(config, params, MemoryCache, trace);

  // Execute the cached request
  return cachedRequestFn(url, options);
}

/**
 * Orchestrates product API requests with pagination
 * @param {Object} params - Query parameters
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Product API response
 */
async function orchestrateProductRequests(params, config, actionParams, trace = null) {
  const { buildProductsEndpoint } = require('../utils/endpoint-builders');

  // Build endpoint URL
  const endpoint = buildProductsEndpoint(params, config);

  // Execute request
  return executeCommerceRequest(endpoint, { method: 'GET' }, config, actionParams, trace);
}

/**
 * Orchestrates inventory API requests for multiple SKUs
 * @param {Array<string>} skus - Array of product SKUs
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of inventory responses
 */
async function orchestrateInventoryRequests(skus, config, params, trace = null) {
  const { buildStockItemEndpoint } = require('../utils/endpoint-builders');

  // Split SKUs into batches for multiple requests
  const batchSize = config.commerce.batching.inventory || 50;
  const batches = [];

  for (let i = 0; i < skus.length; i += batchSize) {
    batches.push(skus.slice(i, i + batchSize));
  }

  // Create requests for each batch
  const requests = batches.map((batch) => ({
    url: buildStockItemEndpoint(batch, config),
    options: { method: 'GET' },
  }));

  // Execute batch requests
  return executeBatchCommerceRequests(requests, config, params, trace);
}

/**
 * Orchestrates category API requests for multiple category IDs
 * @param {Array<string>} categoryIds - Array of category IDs
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of category responses
 */
async function orchestrateCategoryRequests(categoryIds, config, params, trace = null) {
  const { buildCategoryEndpoint } = require('../utils/endpoint-builders');

  // Create requests for each category
  const requests = categoryIds.map((categoryId) => ({
    url: buildCategoryEndpoint(categoryId, config),
    options: { method: 'GET' },
  }));

  // Execute batch requests
  return executeBatchCommerceRequests(requests, config, params, trace);
}

/**
 * Orchestrates a complete product enrichment request sequence
 * @param {Object} params - Query parameters
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Complete enrichment data
 */
async function orchestrateProductEnrichment(params, config, actionParams, trace = null) {
  // Step 1: Fetch products
  const productResponse = await orchestrateProductRequests(params, config, actionParams, trace);

  if (!productResponse.items || productResponse.items.length === 0) {
    return {
      products: [],
      categories: {},
      inventory: {},
      pagination: productResponse.pagination || {},
    };
  }

  // Step 2: Extract SKUs and category IDs
  const skus = productResponse.items.map((product) => product.sku).filter(Boolean);
  const categoryIds = new Set();

  productResponse.items.forEach((product) => {
    if (Array.isArray(product.categories)) {
      product.categories.forEach((category) => {
        if (category.id) categoryIds.add(String(category.id));
      });
    }
  });

  // Step 3: Fetch inventory and category data in parallel
  const [inventoryResponses, categoryResponses] = await Promise.all([
    skus.length > 0
      ? orchestrateInventoryRequests(skus, config, actionParams, trace)
      : Promise.resolve([]),
    categoryIds.size > 0
      ? orchestrateCategoryRequests(Array.from(categoryIds), config, actionParams, trace)
      : Promise.resolve([]),
  ]);

  return {
    products: productResponse.items,
    categories: categoryResponses,
    inventory: inventoryResponses,
    pagination: productResponse.pagination || {},
  };
}

/**
 * Handles API request errors with context
 * @param {Error} error - Request error
 * @param {Object} context - Request context
 * @returns {Object} Enhanced error information
 */
function handleApiRequestError(error, context = {}) {
  const { url, method = 'GET', attempt = 1 } = context;

  return {
    originalError: error,
    context: {
      url,
      method,
      attempt,
      timestamp: new Date().toISOString(),
    },
    enhancedMessage: `Commerce API request failed: ${error.message}`,
    isRetryable: error.code !== 'ENOTFOUND' && error.status !== 404,
  };
}

module.exports = {
  executeCommerceRequest,
  executeBatchCommerceRequests,
  executeCachedCommerceRequest,
  orchestrateProductRequests,
  orchestrateInventoryRequests,
  orchestrateCategoryRequests,
  orchestrateProductEnrichment,
  handleApiRequestError,
};
