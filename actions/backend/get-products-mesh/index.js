/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */
const { loadConfig } = require('../../../config');
const { getAuthToken } = require('../../../src/commerce/api/integration');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
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
 * Fetch enriched products from API Mesh using True Mesh Pattern
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
        performance { processedProducts apiCalls method executionTime }
      }
    }
  `;

  const variables = {
    pageSize: config.products?.perPage || 100,
  };

  // Make GraphQL request to mesh with admin token
  const meshResponse = await fetch(meshEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': meshApiKey,
      'x-commerce-admin-token': adminToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!meshResponse.ok) {
    throw new Error(`Mesh API request failed: ${meshResponse.status} ${meshResponse.statusText}`);
  }

  const result = await meshResponse.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
  }

  const meshData = result.data?.mesh_products_enriched;
  if (!meshData) {
    throw new Error('No data returned from mesh query');
  }

  if (meshData.status === 'error') {
    throw new Error(`Mesh data consolidation error: ${meshData.message}`);
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

    // Step 1: Fetch enriched products from mesh (already processed)
    const enrichedProducts = await fetchEnrichedProductsFromMesh(config, actionParams);

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
          steps: [
            'Successfully validated Commerce API credentials and mesh configuration',
            `Successfully fetched and consolidated ${enrichedProducts.length} products with category and inventory data`,
            `Successfully transformed ${enrichedProducts.length} products for export`,
          ],
          performance: {
            processedProducts: enrichedProducts.length,
            apiCalls: 1,
            method: 'API Mesh',
          },
        },
        'Product data retrieved successfully',
        {}
      );
    }

    // Default CSV format
    // Step 2: Create CSV
    const csvData = await createCsv(enrichedProducts);

    // Step 3: Store CSV
    const storageResult = await storeCsv(csvData, actionParams);

    if (!storageResult.stored) {
      throw new Error(
        `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
      );
    }

    return response.success(
      {
        message: 'Product export completed successfully',
        steps: [
          'Successfully validated Commerce API credentials and mesh configuration',
          `Successfully fetched and consolidated ${enrichedProducts.length} products with category and inventory data`,
          `Successfully transformed ${enrichedProducts.length} products for export`,
          `Successfully generated CSV file (${formatFileSize(csvData.stats.originalSize)})`,
          `Successfully stored CSV file as ${storageResult.fileName} (${formatFileSize(csvData.stats.originalSize)})`,
        ],
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
