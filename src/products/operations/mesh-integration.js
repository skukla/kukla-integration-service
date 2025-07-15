/**
 * API Mesh integration for products domain
 * @module products/mesh
 *
 * Provides GraphQL mesh integration utilities for product data retrieval.
 * Moved from action-specific lib to domain for reusability.
 */

const { getAuthToken } = require('../../commerce/utils/admin-auth');

/**
 * Make GraphQL request to mesh with retry logic
 * @param {Object} requestConfig - Request configuration
 * @param {string} requestConfig.endpoint - Mesh endpoint URL
 * @param {Object} requestConfig.requestBody - GraphQL request body
 * @param {Object} requestConfig.headers - Request headers
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} GraphQL response
 */
async function makeMeshRequestWithRetry(requestConfig, options = {}) {
  const { endpoint, requestBody, headers } = requestConfig;
  const { retries = 3, retryDelay = 1000, timeout = 30000 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Mesh request attempt ${attempt + 1}:`, {
        endpoint,
        hasApiKey: !!headers['x-api-key'],
        bodySize: JSON.stringify(requestBody).length,
        query: requestBody.query?.substring(0, 100) + '...',
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Mesh API request failed: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      return result;
    } catch (error) {
      console.error(`Mesh request attempt ${attempt + 1} failed:`, {
        errorMessage: error.message,
        errorName: error.name,
        endpoint,
        statusCode: error.status || 'unknown',
      });
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(`Mesh request failed after ${retries + 1} attempts: ${lastError.message}`);
}

/**
 * Creates GraphQL query for mesh products enrichment
 * @returns {string} GraphQL query
 */
function createMeshQuery() {
  return `
    query GetEnrichedProducts($pageSize: Int) {
      mesh_products_enriched(pageSize: $pageSize) {
        products {
          sku
          name
          price
          qty
          categories { id name }
          media_gallery_entries { file url position types }
          inventory { qty is_in_stock }
        }
        total_count
        message
        status
        performance { 
          processedProducts 
          apiCalls 
          method 
          executionTime
          totalTime
          productFetch
          dataExtraction
          parallelFetch
          dataEnrichment
          productsApiCalls
          categoriesApiCalls
          inventoryApiCalls
          totalApiCalls
          uniqueCategories
          productCount
          skuCount
          clientCalls
          dataSourcesUnified
          queryConsolidation
          cacheHitRate
          categoriesCached
          categoriesFetched
          operationComplexity
          dataFreshness
          clientComplexity
          apiOrchestration
          parallelization
          meshOptimizations
          batchOptimizations {
            categoriesBatched
            inventoryBatched
            apiCallsReduced
          }
        }
      }
    }
  `;
}

/**
 * Creates request configuration for mesh API call
 * @param {Object} config - Configuration object
 * @param {Object} credentials - All credential data
 * @param {string} credentials.adminToken - Pre-generated admin bearer token
 * @param {string} credentials.meshApiKey - Mesh API key
 * @returns {Object} Request configuration
 */
function createMeshRequestConfig(config, credentials) {
  const { adminToken, meshApiKey } = credentials;
  const query = createMeshQuery();
  const variables = {
    pageSize: config.products.pagination.pageSize,
  };

  const requestBody = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': meshApiKey,
    // Admin token via HTTP header (secure approach)
    'x-commerce-admin-token': adminToken,
  };

  return { requestBody, headers };
}

/**
 * Validates mesh configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validated mesh configuration
 */
function validateMeshConfiguration(config) {
  if (!config.mesh) {
    throw new Error('Mesh configuration not found');
  }

  const meshEndpoint = config.mesh.endpoint;
  if (!meshEndpoint) {
    throw new Error('Mesh endpoint not configured');
  }

  const meshApiKey = config.mesh.apiKey;
  if (!meshApiKey) {
    throw new Error('Mesh API key not configured');
  }

  return { meshEndpoint, meshApiKey };
}

/**
 * Validates mesh response
 * @param {Object} result - Mesh response
 * @returns {Object} Validated mesh response
 */
function validateMeshResponse(result) {
  if (!result.data) {
    throw new Error('No data in mesh response');
  }

  if (!result.data.mesh_products_enriched) {
    throw new Error('No mesh_products_enriched in response');
  }

  const meshData = result.data.mesh_products_enriched;
  if (!meshData.products || !Array.isArray(meshData.products)) {
    throw new Error('Invalid products data in mesh response');
  }

  return meshData;
}

/**
 * Fetches enriched products from API Mesh
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @returns {Promise<Object>} Full mesh response object
 */
async function fetchEnrichedProductsFromMesh(config, actionParams) {
  const { meshEndpoint, meshApiKey } = validateMeshConfiguration(config);

  // Generate admin token using established Commerce authentication pattern
  const adminToken = await getAuthToken(actionParams, config);

  if (!adminToken) {
    throw new Error(
      'Failed to generate admin token: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD required'
    );
  }

  const credentials = {
    adminToken,
    meshApiKey,
  };

  const { requestBody, headers } = createMeshRequestConfig(config, credentials);

  const requestConfig = { endpoint: meshEndpoint, requestBody, headers };
  const result = await makeMeshRequestWithRetry(requestConfig, {
    retries: config.performance.retries.api.mesh.attempts,
    retryDelay: config.performance.retries.api.mesh.delay,
    timeout: config.performance.timeouts.api.mesh,
  });

  // Validate and extract mesh data
  const meshData = validateMeshResponse(result);

  return meshData;
}

module.exports = {
  makeMeshRequestWithRetry,
  createMeshQuery,
  createMeshRequestConfig,
  validateMeshConfiguration,
  validateMeshResponse,
  fetchEnrichedProductsFromMesh,
};
