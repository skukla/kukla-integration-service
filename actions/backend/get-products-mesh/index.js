/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */
const { loadConfig } = require('../../../config');
const { getAuthToken } = require('../../../src/commerce/auth');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { createTraceContext, traceStep } = require('../../../src/core/tracing');
const createCsv = require('../get-products/steps/createCsv');
const storeCsv = require('../get-products/steps/storeCsv');
const validateInput = require('../get-products/steps/validateInput');

/**
 * Format file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Round to 2 decimal places
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

/**
 * Format step message for API response (same as REST API)
 * @param {string} name - Step name
 * @param {string} status - Step status (success/error)
 * @param {Object} details - Step details
 * @returns {string} Formatted step message
 */
function formatStepMessage(name, status, details = {}) {
  const stepMessages = {
    'extract-params': {
      success: 'Successfully extracted and validated action parameters',
      error: 'Failed to extract action parameters',
    },
    'validate-input': {
      success: 'Successfully validated Commerce API credentials and URL',
      error: 'Failed to validate input parameters',
    },
    'fetch-and-enrich': {
      success: (count) =>
        `Successfully fetched and enriched ${count} products with category and inventory data`,
      error: 'Failed to fetch products from API Mesh',
    },
    'build-products': {
      success: (count) => `Successfully transformed ${count} products for export`,
      error: 'Failed to transform product data',
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
 * Fetch products from API Mesh (replaces fetchAndEnrichProducts step)
 * @param {Object} actionParams - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Products array with enriched data
 */
async function fetchProductsFromMesh(actionParams, config) {
  const meshConfig = config.mesh;

  if (!meshConfig || !meshConfig.endpoint) {
    throw new Error('API Mesh not configured');
  }

  // Get Commerce token first
  const token = await getAuthToken(actionParams);
  if (!token) {
    throw new Error('Failed to get Commerce authentication token');
  }

  // Prepare GraphQL query for full products
  const query = `
    query GetProductsFull($pageSize: Int) {
      mesh_products_full(pageSize: $pageSize) {
        products
        total_count
        message
        status
      }
    }
  `;

  const variables = {
    pageSize: 100, // Get full product data
  };

  // Execute GraphQL query via API Mesh
  const meshResponse = await fetch(meshConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${actionParams.MESH_API_KEY || meshConfig.apiKey}`,
      // Pass Commerce token to mesh resolver
      'x-commerce-token': token,
      // Pass environment for config selection
      'x-environment': config.environment || 'staging',
      // Catalog Service headers (if needed)
      'x-catalog-api-key': actionParams.CATALOG_SERVICE_API_KEY,
      'x-catalog-environment-id': actionParams.CATALOG_SERVICE_ENVIRONMENT_ID,
      'x-catalog-customer-group': 'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c',
      'x-catalog-store-code': actionParams.CATALOG_SERVICE_STORE_CODE,
      'x-catalog-store-view-code': actionParams.CATALOG_SERVICE_STORE_VIEW_CODE,
      'x-catalog-website-code': actionParams.CATALOG_SERVICE_WEBSITE_CODE,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!meshResponse.ok) {
    const errorText = await meshResponse.text();
    throw new Error(
      `API Mesh request failed: ${meshResponse.status} ${meshResponse.statusText} - ${errorText}`
    );
  }

  const meshData = await meshResponse.json();

  if (meshData.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(meshData.errors)}`);
  }

  if (!meshData.data || !meshData.data.mesh_products_full) {
    throw new Error(`Invalid API Mesh response: ${JSON.stringify(meshData)}`);
  }

  const productsData = meshData.data.mesh_products_full;

  if (productsData.status !== 'success') {
    throw new Error(`Products query failed: ${productsData.message}`);
  }

  const products = productsData.products || [];

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products returned from mesh resolver');
  }

  // HTTP bridge already returns products in the correct format
  return products;
}

/**
 * Main action handler for get-products-mesh (same pattern as REST API)
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Extract and validate parameters first for consistent usage
  const actionParams = extractActionParams(params);

  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {});
  }

  try {
    await validateInput(actionParams);

    // Initialize configuration and tracing
    const config = loadConfig(actionParams);
    const trace = createTraceContext('get-products-mesh', actionParams);
    const steps = [];

    // Step 1: Validate input (reused)
    steps.push(formatStepMessage('validate-input', 'success'));

    // Step 2: Fetch and enrich products (API Mesh version)
    const products = await traceStep(trace, 'fetch-products-mesh', async () => {
      return await fetchProductsFromMesh(actionParams, config);
    });
    steps.push(formatStepMessage('fetch-and-enrich', 'success', { count: products.length }));

    // Step 3: Products from HTTP Bridge are already built, just pass through
    const builtProducts = products; // HTTP Bridge returns already-processed products
    steps.push(formatStepMessage('build-products', 'success', { count: builtProducts.length }));

    // Check format parameter to determine response type
    const format = actionParams.format || 'csv';

    if (format === 'json') {
      // Return JSON format for debugging
      return response.success(
        {
          products: builtProducts,
          total_count: builtProducts.length,
          message:
            'Successfully fetched ' +
            builtProducts.length +
            ' products with category and inventory data',
          status: 'success',
          steps,
          performance: {
            processedProducts: builtProducts.length,
            apiCalls: 1, // API Mesh consolidates many calls into 1
            method: 'API Mesh',
          },
        },
        'Product data retrieved successfully',
        {}
      );
    }

    // Default CSV format
    // Step 4: Create CSV (reused)
    const csvData = await traceStep(trace, 'create-csv', async () => {
      return await createCsv(builtProducts);
    });
    steps.push(formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

    // Step 5: Store CSV (reused)
    const storageResult = await traceStep(trace, 'store-csv', async () => {
      return await storeCsv(csvData, actionParams, config);
    });
    steps.push(formatStepMessage('store-csv', 'success', { info: storageResult }));

    // Calculate total duration
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
          processedProducts: builtProducts.length,
          apiCalls: 1, // API Mesh consolidates many calls into 1
          method: 'API Mesh', // Show correct method for clarity
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

module.exports = {
  main,
};
