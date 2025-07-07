/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

// Use domain catalogs instead of scattered imports
const { loadConfig } = require('../../../config');
const { products, files, shared } = require('../../../src');

/**
 * Make GraphQL request to mesh with retry logic
 * @param {string} endpoint - Mesh endpoint URL
 * @param {Object} requestBody - GraphQL request body
 * @param {Object} headers - Request headers
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
 * Extracts and validates OAuth credentials from action parameters
 * @param {Object} actionParams - Action parameters
 * @returns {Object} Validated OAuth credentials
 */
function extractOAuthCredentials(actionParams) {
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

  return oauthCredentials;
}

/**
 * Validates admin credentials for inventory access
 * @param {Object} actionParams - Action parameters
 * @returns {Object} Validated admin credentials
 */
function validateAdminCredentials(actionParams) {
  if (!actionParams.COMMERCE_ADMIN_USERNAME || !actionParams.COMMERCE_ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials required for inventory: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    );
  }

  return {
    adminUsername: actionParams.COMMERCE_ADMIN_USERNAME,
    adminPassword: actionParams.COMMERCE_ADMIN_PASSWORD,
  };
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
  };

  return { requestBody, headers };
}

/**
 * Validates mesh response data
 * @param {Object} result - API response result
 * @returns {Object} Validated mesh data
 */
function validateMeshResponse(result) {
  const meshData = result.data?.mesh_products_enriched;
  if (!meshData) {
    throw new Error('No data returned from mesh query');
  }

  if (meshData.status === 'error') {
    throw new Error(`Mesh data consolidation error: ${meshData.message}`);
  }

  return meshData;
}

/**
 * Fetch enriched products from API Mesh
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @returns {Promise<Object>} Full mesh response object
 */
async function fetchEnrichedProductsFromMesh(config, actionParams) {
  const { meshEndpoint, meshApiKey } = validateMeshConfiguration(config);
  const oauthCredentials = extractOAuthCredentials(actionParams);
  const adminCredentials = validateAdminCredentials(actionParams);

  const credentials = {
    oauth: oauthCredentials,
    admin: adminCredentials,
    meshApiKey,
  };

  const { requestBody, headers } = createMeshRequestConfig(config, credentials);

  const requestConfig = { endpoint: meshEndpoint, requestBody, headers };
  const result = await makeMeshRequestWithRetry(requestConfig, {
    retries: config.mesh.retries || 3,
    retryDelay: 1000,
    timeout: config.mesh.timeout || 30000,
  });

  return validateMeshResponse(result);
}

/**
 * Executes the core mesh data processing steps
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Processing results
 */
async function executeMeshProcessingSteps(config, actionParams, trace) {
  const steps = [];

  // Step 1: Validate mesh configuration using products domain
  await shared.traceStep(trace, 'validate-mesh', async () => {
    return await products.validateMeshInput(actionParams, config);
  });
  steps.push(shared.formatStepMessage('validate-mesh', 'success'));

  // Step 2: Fetch enriched products from mesh
  const meshData = await shared.traceStep(trace, 'fetch-mesh', async () => {
    return await fetchEnrichedProductsFromMesh(config, actionParams);
  });
  steps.push(shared.formatStepMessage('fetch-mesh', 'success', { count: meshData.total_count }));

  // Sort products by SKU for consistent output
  meshData.products.sort((a, b) => a.sku.localeCompare(b.sku));

  // Step 3: Build product data using products domain
  const builtProducts = await shared.traceStep(trace, 'build-products', async () => {
    return await products.buildProducts(meshData.products, config);
  });
  steps.push(
    shared.formatStepMessage('build-products', 'success', { count: builtProducts.length })
  );

  return { steps, meshData, builtProducts };
}

/**
 * Creates JSON response for API Mesh integration
 * @param {Object} builtProducts - Built product data
 * @param {Object} meshData - Mesh response data
 * @param {Array} steps - Processing steps
 * @returns {Object} JSON response
 */
function createJsonResponse(builtProducts, meshData, steps) {
  return shared.success(
    {
      products: builtProducts,
      total_count: builtProducts.length,
      message: meshData.message,
      status: meshData.status,
      steps,
      performance: meshData.performance,
    },
    'Product data retrieved successfully',
    {}
  );
}

/**
 * Executes CSV processing steps
 * @param {Object} builtProducts - Built product data
 * @param {Object} processingContext - Processing context
 * @param {Object} processingContext.config - Configuration object
 * @param {Object} processingContext.actionParams - Action parameters
 * @param {Object} processingContext.trace - Trace context
 * @param {Array} processingContext.steps - Processing steps array
 * @returns {Promise<Object>} CSV processing results
 */
async function executeCsvProcessingSteps(builtProducts, processingContext) {
  const { config, actionParams, trace, steps } = processingContext;

  // Step 4: Create CSV using products domain
  const csvData = await shared.traceStep(trace, 'create-csv', async () => {
    return await products.createCsv(builtProducts, config);
  });
  steps.push(
    shared.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize })
  );

  // Step 5: Store CSV using files domain
  const storageResult = await shared.traceStep(trace, 'store-csv', async () => {
    return await files.storeCsv(csvData, config, actionParams);
  });
  steps.push(shared.formatStepMessage('store-csv', 'success', { info: storageResult }));

  return { storageResult };
}

/**
 * Creates CSV export success response
 * @param {Object} exportData - Export data and context
 * @param {Array} exportData.steps - Processing steps
 * @param {Object} exportData.storageResult - Storage operation result
 * @param {Object} exportData.meshData - Mesh response data
 * @param {Object} exportData.trace - Trace context
 * @returns {Object} CSV export response
 */
function createCsvExportResponse(exportData) {
  const { steps, storageResult, meshData, trace } = exportData;
  const endTime = Date.now();
  const totalDuration = endTime - trace.startTime;

  return shared.success(
    {
      message: 'Product export completed successfully',
      steps,
      downloadUrl: storageResult.downloadUrl,
      storage: {
        provider: storageResult.storageType,
        location: storageResult.location || storageResult.fileName,
        properties: storageResult.properties,
      },
      performance: {
        // Include mesh performance metrics
        ...meshData.performance,
        // Add total duration
        duration: totalDuration,
        durationFormatted: `${(totalDuration / 1000).toFixed(1)}s`,
        // Override method to ensure consistency
        method: 'API Mesh',
      },
    },
    'Product export completed',
    {}
  );
}

/**
 * Main action handler for get-products-mesh
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const actionParams = shared.extractActionParams(params);

  if (params.__ow_method === 'options') {
    return shared.success({}, 'Preflight success', {});
  }

  try {
    // Initialize configuration
    const config = loadConfig(actionParams);
    const trace = shared.createTraceContext('get-products-mesh', config, actionParams);

    // Execute core processing steps
    const { steps, meshData, builtProducts } = await executeMeshProcessingSteps(
      config,
      actionParams,
      trace
    );

    // Check format parameter to determine response type
    const format = actionParams.format || 'csv';

    if (format === 'json') {
      return createJsonResponse(builtProducts, meshData, steps);
    }

    // Default CSV format
    const processingContext = { config, actionParams, trace, steps };
    const { storageResult } = await executeCsvProcessingSteps(builtProducts, processingContext);

    const exportData = { steps, storageResult, meshData, trace };
    return createCsvExportResponse(exportData);
  } catch (error) {
    return shared.error(error, {});
  }
}

module.exports = {
  main,
};
