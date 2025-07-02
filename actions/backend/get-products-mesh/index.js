/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */
const { loadConfig } = require('../../../config');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { createTraceContext, traceStep, formatTrace } = require('../../../src/core/tracing');
const { formatStepMessage } = require('../../../src/core/utils');
// Import shared step functions for consistency
const buildProducts = require('../get-products/steps/buildProducts');
const createCsv = require('../get-products/steps/createCsv');
const storeCsv = require('../get-products/steps/storeCsv');

/**
 * Make GraphQL request to mesh with retry logic
 * @param {string} endpoint - Mesh endpoint URL
 * @param {Object} requestBody - GraphQL request body
 * @param {Object} headers - Request headers
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} GraphQL response
 */
async function makeMeshRequestWithRetry(endpoint, requestBody, headers, options = {}) {
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
 * Fetch enriched products from API Mesh
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @returns {Promise<Object>} Full mesh response object
 */
async function fetchEnrichedProductsFromMesh(config, actionParams) {
  const meshEndpoint = config.mesh.endpoint;
  const meshApiKey = config.mesh.apiKey;

  if (!meshEndpoint || !meshApiKey) {
    throw new Error('Mesh configuration missing: endpoint or API key not found');
  }

  // Extract OAuth credentials for mesh resolver
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

  // Validate admin credentials for inventory
  if (!actionParams.COMMERCE_ADMIN_USERNAME || !actionParams.COMMERCE_ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials required for inventory: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    );
  }

  const query = `
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
        }
      }
    }
  `;

  const variables = {
    pageSize: config.mesh.pagination.defaultPageSize || config.products.batchSize || 100,
    adminUsername: actionParams.COMMERCE_ADMIN_USERNAME,
    adminPassword: actionParams.COMMERCE_ADMIN_PASSWORD,
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

  const result = await makeMeshRequestWithRetry(meshEndpoint, requestBody, headers, {
    retries: config.mesh.retries || 3,
    retryDelay: 1000,
    timeout: config.mesh.timeout || 30000,
  });

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
 * Main action handler for get-products-mesh
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const actionParams = extractActionParams(params);
  const trace = createTraceContext('get-products-mesh', actionParams);

  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {});
  }

  try {
    const config = loadConfig(actionParams);
    const steps = [];

    steps.push(formatStepMessage('validate-mesh', 'success'));

    const meshResponse = await traceStep(trace, 'fetch-mesh', async () => {
      return await fetchEnrichedProductsFromMesh(config, actionParams);
    });

    const enrichedProducts = meshResponse.products || [];
    steps.push(formatStepMessage('fetch-mesh', 'success', { count: enrichedProducts.length }));

    enrichedProducts.sort((a, b) => a.sku.localeCompare(b.sku));

    if (trace && meshResponse.performance) {
      trace.meshPerformance = meshResponse.performance;
    }

    if (actionParams.format === 'json') {
      // Use mesh performance data if available, otherwise use trace data
      const performanceData = meshResponse.performance || formatTrace(trace);

      return response.success({
        products: enrichedProducts,
        total_count: enrichedProducts.length,
        message: `Successfully fetched ${enrichedProducts.length} products`,
        status: 'success',
        steps,
        performance: performanceData,
      });
    }

    const builtProducts = await traceStep(trace, 'build-products', async () => {
      return await buildProducts(enrichedProducts, config);
    });
    steps.push(formatStepMessage('build-products', 'success', { count: builtProducts.length }));

    const csvData = await traceStep(trace, 'create-csv', async () => {
      return await createCsv(builtProducts);
    });
    steps.push(formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

    const storageResult = await traceStep(trace, 'store-csv', async () => {
      return await storeCsv(csvData, actionParams, config);
    });

    if (!storageResult.stored) {
      throw new Error(
        `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
      );
    }
    steps.push(formatStepMessage('store-csv', 'success', { info: storageResult }));

    // Calculate total duration
    const endTime = Date.now();
    const totalDuration = endTime - trace.startTime;

    // Use mesh performance data if available, otherwise use calculated values
    const meshPerformanceData = meshResponse.performance || {};

    return response.success(
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
          processedProducts: meshPerformanceData.processedProducts || builtProducts.length,
          apiCalls: meshPerformanceData.totalApiCalls || meshPerformanceData.apiCalls || 1,
          method: meshPerformanceData.method || 'API Mesh',
          duration: totalDuration,
          durationFormatted: `${(totalDuration / 1000).toFixed(1)}s`,
        },
      },
      'Product export completed',
      {}
    );
  } catch (error) {
    return response.error(error, {});
  }
}

module.exports = { main };
