/**
 * Adobe App Builder Action: Export Adobe Commerce product data via API Mesh
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { createCache } = require('../../lib/cache');
const { getProductsFromMesh } = require('../../lib/commerce');
const { createCsv } = require('../../lib/csv');
const { storeCsv } = require('../../lib/storage');
const { errorResponse, successResponse, checkMissingRequestInputs } = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('get-products-mesh', { level: params.LOG_LEVEL || 'info' });
  const startTime = Date.now();

  try {
    // Validate required parameters
    const requiredParams = [
      'API_MESH_ENDPOINT',
      'MESH_API_KEY',
      'COMMERCE_ADMIN_USERNAME',
      'COMMERCE_ADMIN_PASSWORD',
    ];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    // Initialize cache for mesh operations
    const config = createConfig(params);
    const cache = await createCache(params, config, logger);

    logger.info('Cache initialization status', {
      enabled: cache.enabled,
      state: cache.state ? 'initialized' : 'null',
      bypassCache: config.cache.bypassCache,
    });

    // Fetch products via mesh (no caching currently)
    const meshData = await getProductsFromMesh(params, config, logger);

    // Debug: Log first product structure for comparison
    if (meshData.products && meshData.products.length > 0) {
      logger.info('Mesh API product sample', {
        productCount: meshData.products.length,
        firstProductKeys: Object.keys(meshData.products[0]),
        firstProductSample: {
          sku: meshData.products[0].sku,
          name: meshData.products[0].name,
          categories: meshData.products[0].categories?.length || 0,
          inventory: meshData.products[0].inventory,
          customAttributes: meshData.products[0].custom_attributes?.length || 0,
        },
      });
    }

    const csvData = await createCsv(meshData.products);
    const storageResult = await storeCsv(csvData.content, config);

    if (!storageResult.stored) {
      const errorMsg = `Storage failed: ${storageResult.error?.message || 'Unknown error'}`;
      return errorResponse(500, errorMsg, logger);
    }

    return successResponse(
      {
        downloadUrl: storageResult.downloadUrl,
        productCount: meshData.products.length,
        provider: storageResult.provider,
        fileName: storageResult.fileName,
        method: 'API Mesh',
        apiCalls: meshData.performance?.apiCalls,
        performance: {
          method: meshData.performance?.method || 'API Mesh',
          productCount: meshData.performance?.productCount || meshData.products.length,
          executionTime: Date.now() - startTime,
          apiCalls: meshData.performance?.apiCalls || meshData.apiCallCount,
          dataSourcesUnified: meshData.performance?.dataSourcesUnified || 3,
          productsApiCalls: meshData.performance?.productsApiCalls || 0,
          categoriesApiCalls: meshData.performance?.categoriesApiCalls || 0,
          inventoryApiCalls: meshData.performance?.inventoryApiCalls || 0,
          cacheHits: meshData.cacheHits || 0,
          cachingEnabled: meshData.performance?.cachingEnabled || cache.enabled,
        },
      },
      'Products exported successfully',
      logger
    );
  } catch (error) {
    logger.error('Action failed', { error: error.message });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
