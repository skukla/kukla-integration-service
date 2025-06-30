/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */
const { loadConfig } = require('../../../config');
const { getAuthToken } = require('../../../src/commerce/api/integration');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { createTraceContext, traceStep } = require('../../../src/core/tracing');
const createCsv = require('../get-products/steps/createCsv');
const storeCsv = require('../get-products/steps/storeCsv');

/**
 * Format file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

/**
 * Format step message for API response
 * @param {string} name - Step name
 * @param {string} status - Step status (success/error)
 * @param {Object} details - Step details
 * @returns {string} Formatted step message
 */
function formatStepMessage(name, status, details = {}) {
  const stepMessages = {
    'validate-mesh': {
      success: 'Successfully validated Commerce API credentials and mesh configuration',
      error: 'Failed to validate mesh configuration',
    },
    'fetch-mesh': {
      success: (count) =>
        `Successfully fetched and consolidated ${count} products with category and inventory data`,
      error: 'Failed to fetch products from API Mesh',
    },
    'create-csv': {
      success: (size) => `Successfully generated CSV file (${formatFileSize(size)})`,
      error: 'Failed to generate CSV file',
    },
    'store-csv': {
      success: (info) => {
        const size = parseInt(info.properties.size) || info.properties.size;
        const formattedSize = typeof size === 'number' ? formatFileSize(size) : size;
        return `Successfully stored CSV file as ${info.fileName} (${formattedSize})`;
      },
      error: 'Failed to store CSV file',
    },
  };

  return status === 'success'
    ? typeof stepMessages[name][status] === 'function'
      ? stepMessages[name][status](details.count || details.size || details.info)
      : stepMessages[name][status]
    : `${stepMessages[name][status]}: ${details.error || ''}`;
}

/**
 * Make GraphQL request to mesh with retry logic (like REST API processConcurrently)
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Mesh API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        // Wait before retry (like REST API)
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(`Mesh request failed after ${retries + 1} attempts: ${lastError.message}`);
}

/**
 * Fetch enriched products from API Mesh using True Mesh Pattern with performance optimizations
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @returns {Promise<Array>} Products array with enriched data
 */
async function fetchEnrichedProductsFromMesh(config, actionParams) {
  const meshEndpoint = config.mesh.endpoint;
  const meshApiKey = config.mesh.apiKey;

  if (!meshEndpoint || !meshApiKey) {
    throw new Error('Mesh configuration missing: endpoint or API key not found');
  }

  // Generate admin token for mesh authentication
  const adminToken = await getAuthToken(actionParams);

  // GraphQL query for True Mesh Pattern
  const query = `
    query GetEnrichedProducts($pageSize: Int) {
      mesh_products_enriched(pageSize: $pageSize) {
        products {
          sku
          name
          price
          qty
          categories { id name }
          images { filename url position roles }
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

  // Use optimized batch size from configuration (like REST API)
  const variables = {
    pageSize: config.mesh.pagination.defaultPageSize || config.products.batchSize || 100,
  };

  const requestBody = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': meshApiKey,
    'x-commerce-admin-token': adminToken,
  };

  // Apply retry logic and timeout configuration (like REST API)
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

  // Store performance data globally for detailed logging
  if (meshData.performance && meshData.performance.totalTime) {
    global.lastMeshPerformance = meshData.performance;
  }

  return meshData.products || [];
}

/**
 * Main action handler for get-products-mesh
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const actionParams = extractActionParams(params);

  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {});
  }

  try {
    const config = loadConfig(actionParams);

    // Initialize tracing like REST API
    const trace = createTraceContext('get-products-mesh', actionParams);
    const steps = [];

    // Step 1: Validate mesh configuration
    steps.push(formatStepMessage('validate-mesh', 'success'));

    // Step 2: Fetch enriched products from mesh (already processed)
    const enrichedProducts = await traceStep(trace, 'fetch-mesh', async () => {
      return await fetchEnrichedProductsFromMesh(config, actionParams);
    });
    steps.push(formatStepMessage('fetch-mesh', 'success', { count: enrichedProducts.length }));

    // Log detailed performance data from mesh (if available in global context)
    if (global.lastMeshPerformance) {
      console.log('🔍 DETAILED MESH PERFORMANCE BREAKDOWN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total Execution Time: ${global.lastMeshPerformance.totalTime}`);
      console.log('');
      console.log('Step Breakdown:');
      console.log(`  Product Fetch:    ${global.lastMeshPerformance.productFetch}`);
      console.log(`  Data Extraction:  ${global.lastMeshPerformance.dataExtraction}`);
      console.log(`  Parallel Fetch:   ${global.lastMeshPerformance.parallelFetch}`);
      console.log(`  Data Enrichment:  ${global.lastMeshPerformance.dataEnrichment}`);
      console.log('');
      console.log('API Call Counts:');
      console.log(`  Products:    ${global.lastMeshPerformance.productsApiCalls} calls`);
      console.log(`  Categories:  ${global.lastMeshPerformance.categoriesApiCalls} calls`);
      console.log(`  Inventory:   ${global.lastMeshPerformance.inventoryApiCalls} calls`);
      console.log(`  Total:       ${global.lastMeshPerformance.totalApiCalls} calls`);
      console.log('');
      console.log('Data Points:');
      console.log(`  Products:         ${global.lastMeshPerformance.productCount}`);
      console.log(`  Unique Categories: ${global.lastMeshPerformance.uniqueCategories}`);
      console.log(`  SKUs:             ${global.lastMeshPerformance.skuCount}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Check format parameter to determine response type
    const format = actionParams.format || 'csv';

    if (format === 'json') {
      return response.success(
        {
          products: enrichedProducts,
          total_count: enrichedProducts.length,
          message:
            'Successfully fetched ' +
            enrichedProducts.length +
            ' products with category and inventory data',
          status: 'success',
          steps,
          performance: {
            processedProducts: enrichedProducts.length,
            apiCalls: 1,
            method: 'API Mesh',
            duration: Date.now() - trace.startTime,
            durationFormatted: `${((Date.now() - trace.startTime) / 1000).toFixed(1)}s`,
          },
        },
        'Product data retrieved successfully',
        {}
      );
    }

    // Default CSV format
    // Step 3: Create CSV
    const csvData = await traceStep(trace, 'create-csv', async () => {
      return await createCsv(enrichedProducts);
    });
    steps.push(formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

    // Step 4: Store CSV
    const storageResult = await traceStep(trace, 'store-csv', async () => {
      return await storeCsv(csvData, actionParams);
    });

    if (!storageResult.stored) {
      throw new Error(
        `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
      );
    }

    steps.push(formatStepMessage('store-csv', 'success', { info: storageResult }));

    // Calculate total duration like REST API
    const endTime = Date.now();
    const totalDuration = endTime - trace.startTime;

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
          processedProducts: enrichedProducts.length,
          apiCalls: 1,
          method: 'API Mesh',
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
