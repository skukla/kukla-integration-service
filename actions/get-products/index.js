/**
 * Adobe App Builder Action: Export Adobe Commerce product data to CSV
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { fetchAndEnrichProducts } = require('../../lib/commerce');
const { createCsv } = require('../../lib/csv');
const { storeCsv } = require('../../lib/storage');
const { errorResponse, successResponse, checkMissingRequestInputs } = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL || 'info' });
  const startTime = Date.now();

  try {
    // Validate required parameters
    const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    // Fetch products, create CSV, and store
    const config = createConfig(params);
    const result = await fetchAndEnrichProducts(params, config);
    const csvData = await createCsv(result.products);
    const storageResult = await storeCsv(csvData.content, config);

    if (!storageResult.stored) {
      const errorMsg = `Storage failed: ${storageResult.error?.message || 'Unknown error'}`;
      return errorResponse(500, errorMsg, logger);
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
          productsApiCalls: result.apiCalls.products,
          categoriesApiCalls: result.apiCalls.categories,
          inventoryApiCalls: result.apiCalls.inventory,
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
