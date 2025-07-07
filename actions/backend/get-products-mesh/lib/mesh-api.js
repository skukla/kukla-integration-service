/**
 * API Mesh request handling functions
 * @module lib/mesh-api
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
          # Dynamic efficiency metrics
          clientCalls
          dataSourcesUnified
          queryConsolidation
          cacheHitRate
          categoriesCached
          categoriesFetched
          # Mesh advantages
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
    pageSize: config.mesh.pagination.defaultPageSize || config.products.batchSize || 100,
    adminUsername: adminCredentials.adminUsername,
    adminPassword: adminCredentials.adminPassword,
  };

  const requestBody = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': meshApiKey,
    // Pass OAuth credentials to mesh resolver
    'x-commerce-consumer-key': oauthCredentials.consumerKey,
    'x-commerce-consumer-secret': oauthCredentials.consumerSecret,
    'x-commerce-access-token': oauthCredentials.accessToken,
    'x-commerce-access-token-secret': oauthCredentials.accessTokenSecret,
    // Pass admin credentials to mesh resolver
    'x-commerce-admin-username': adminCredentials.adminUsername,
    'x-commerce-admin-password': adminCredentials.adminPassword,
  };

  return { requestBody, headers };
}

module.exports = {
  makeMeshRequestWithRetry,
  createMeshQuery,
  createMeshRequestConfig,
};
