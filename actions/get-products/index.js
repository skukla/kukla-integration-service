/**
 * Adobe App Builder Action: Export Adobe Commerce product data to CSV
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { createCache } = require('../../lib/cache');
const { fetchAndEnrichProducts } = require('../../lib/commerce');
const { createCsv } = require('../../lib/csv');
const { storeCsv } = require('../../lib/storage');
const { errorResponse, successResponse, checkMissingRequestInputs } = require('../../lib/utils');
const { validateAuth } = require('../../lib/auth/ims-validator');

async function main(params) {
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL || 'debug' });
  const startTime = Date.now();

  try {
    // Validate authentication (IMS or service credentials)
    const authResult = await validateAuth(params, logger);
    
    if (!authResult.authenticated) {
      return errorResponse(401, authResult.error, logger);
    }
    
    // Use Commerce credentials from auth result
    params.COMMERCE_ADMIN_USERNAME = authResult.commerceAuth.username;
    params.COMMERCE_ADMIN_PASSWORD = authResult.commerceAuth.password;
    
    // Validate we have Commerce credentials from either source
    const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }
    
    logger.info('Authentication successful', { method: authResult.method });

    // Initialize cache for Commerce API responses
    const config = createConfig(params);
    const cache = await createCache(params, config, logger);

    logger.info('Cache initialization status', {
      enabled: cache.enabled,
      stateInitialized: !!cache.state,
    });

    // Fetch products with caching, create CSV, and store
    const result = await fetchAndEnrichProducts(params, config, cache, logger);

    // Debug: Log first product structure for comparison
    if (result.products && result.products.length > 0) {
      logger.info('REST API product sample', {
        productCount: result.products.length,
        firstProductKeys: Object.keys(result.products[0]),
        firstProductSample: {
          sku: result.products[0].sku,
          name: result.products[0].name,
          categories: result.products[0].categories?.length || 0,
          inventory: result.products[0].inventory,
          customAttributes: result.products[0].custom_attributes?.length || 0,
        },
      });
    }

    const csvData = await createCsv(result.products);
    const storageResult = await storeCsv(csvData.content, config);

    if (!storageResult.stored) {
      const errorMsg = `Storage failed: ${storageResult.error?.message || 'Unknown error'}`;
      return errorResponse(500, errorMsg, logger);
    }

    // Prepare response headers for caching
    const responseHeaders = {};

    // Add HTTP response caching (gateway level) for fair comparison with API Mesh
    if (cache.enabled) {
      responseHeaders['Cache-Control'] = `public, max-age=${config.cache.httpCacheMaxAge}`;
      responseHeaders['Vary'] = 'Authorization'; // Cache per token
    } else {
      responseHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    return successResponse(
      {
        downloadUrl: storageResult.downloadUrl,
        productCount: result.products.length,
        provider: storageResult.provider,
        fileName: storageResult.fileName,
        method: 'REST API',
        apiCalls: result.apiCalls.total,
        performance: {
          method: 'REST API',
          productCount: result.products.length,
          executionTime: Date.now() - startTime,
          apiCalls: result.apiCalls.total,
          dataSourcesUnified: 3,
          adminTokenApiCalls: result.apiCalls.adminToken,
          productsApiCalls: result.apiCalls.products,
          categoriesApiCalls: result.apiCalls.categories,
          inventoryApiCalls: result.apiCalls.inventory,
          totalProductPages: result.apiCalls.totalProductPages || 1,
          totalInventoryBatches: result.apiCalls.totalInventoryBatches || 1,
          cacheHits: result.cacheHits || 0,
          cachingEnabled: cache && cache.enabled,
        },
      },
      'Products exported successfully',
      logger,
      responseHeaders
    );
  } catch (error) {
    logger.error('Action failed', { error: error.message });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
