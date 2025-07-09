/**
 * API Mesh integration for products domain
 * @module products/mesh
 *
 * Provides GraphQL mesh integration utilities for product data retrieval.
 * Moved from action-specific lib to domain for reusability.
 */

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
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      return result;
    } catch (error) {
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
    query GetEnrichedProducts($pageSize: Int, $adminUsername: String, $adminPassword: String) {
      mesh_products_enriched(pageSize: $pageSize, adminUsername: $adminUsername, adminPassword: $adminPassword) {
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
        }
      }
    }
  `;
}

/**
 * Creates request configuration for mesh API call
 * @param {Object} config - Configuration object
 * @param {Object} credentials - All credential data
 * @param {Object} credentials.oauth - OAuth credentials
 * @param {Object} credentials.admin - Admin credentials
 * @param {string} credentials.meshApiKey - Mesh API key
 * @returns {Object} Request configuration
 */
function createMeshRequestConfig(config, credentials) {
  const { oauth: oauthCredentials, admin: adminCredentials, meshApiKey } = credentials;
  const query = createMeshQuery();
  const variables = {
    pageSize: config.mesh.pagination.defaultPageSize,
    adminUsername: adminCredentials.adminUsername,
    adminPassword: adminCredentials.adminPassword,
  };

  const requestBody = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': meshApiKey,
    'x-commerce-consumer-key': oauthCredentials.consumerKey,
    'x-commerce-consumer-secret': oauthCredentials.consumerSecret,
    'x-commerce-access-token': oauthCredentials.accessToken,
    'x-commerce-access-token-secret': oauthCredentials.accessTokenSecret,
    'x-commerce-admin-username': adminCredentials.adminUsername,
    'x-commerce-admin-password': adminCredentials.adminPassword,
  };

  return { requestBody, headers };
}

/**
 * Validates mesh configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validated mesh configuration
 */
function validateMeshConfiguration(config) {
  const meshEndpoint = config.mesh.endpoint;
  const meshApiKey = config.mesh.apiKey;

  if (!meshEndpoint || !meshApiKey) {
    throw new Error('Mesh configuration missing: endpoint or API key not found');
  }

  return { meshEndpoint, meshApiKey };
}

/**
 * Validates the response from the mesh API
 * @param {Object} result - API response result
 * @returns {Object} Validated mesh data
 */
function validateMeshResponse(result) {
  if (!result.data || !result.data.mesh_products_enriched) {
    throw new Error('Invalid mesh response: missing mesh_products_enriched data');
  }

  const meshData = result.data.mesh_products_enriched;
  if (!Array.isArray(meshData.products)) {
    throw new Error('Invalid mesh response: products is not an array');
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
  const oauthCredentials = {
    consumerKey: actionParams.COMMERCE_CONSUMER_KEY,
    consumerSecret: actionParams.COMMERCE_CONSUMER_SECRET,
    accessToken: actionParams.COMMERCE_ACCESS_TOKEN,
    accessTokenSecret: actionParams.COMMERCE_ACCESS_TOKEN_SECRET,
  };

  if (
    !oauthCredentials.consumerKey ||
    !oauthCredentials.consumerSecret ||
    !oauthCredentials.accessToken ||
    !oauthCredentials.accessTokenSecret
  ) {
    throw new Error(
      'OAuth credentials required: COMMERCE_CONSUMER_KEY, COMMERCE_CONSUMER_SECRET, COMMERCE_ACCESS_TOKEN, COMMERCE_ACCESS_TOKEN_SECRET'
    );
  }

  const adminCredentials = {
    adminUsername: actionParams.COMMERCE_ADMIN_USERNAME,
    adminPassword: actionParams.COMMERCE_ADMIN_PASSWORD,
  };

  if (!adminCredentials.adminUsername || !adminCredentials.adminPassword) {
    throw new Error(
      'Admin credentials required for inventory: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    );
  }

  const credentials = {
    oauth: oauthCredentials,
    admin: adminCredentials,
    meshApiKey,
  };

  const { requestBody, headers } = createMeshRequestConfig(config, credentials);

  const requestConfig = { endpoint: meshEndpoint, requestBody, headers };
  const result = await makeMeshRequestWithRetry(requestConfig, {
    retries: config.mesh.retries,
    retryDelay: config.commerce.api.retryDelay,
    timeout: config.mesh.timeout,
  });

  return validateMeshResponse(result);
}

module.exports = {
  makeMeshRequestWithRetry,
  createMeshQuery,
  createMeshRequestConfig,
  validateMeshConfiguration,
  validateMeshResponse,
  fetchEnrichedProductsFromMesh,
};
