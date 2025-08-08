/**
 * Adobe App Builder Action: Export Adobe Commerce product data via API Mesh
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
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

    // Fetch products, create CSV, and store
    const config = createConfig(params);
    const meshData = await getProductsFromMesh(params, config, logger);
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
          method: meshData.performance?.method,
          productCount: meshData.performance?.productCount,
          executionTime: Date.now() - startTime,
          apiCalls: meshData.performance?.apiCalls,
          dataSourcesUnified: meshData.performance?.dataSourcesUnified,
          productsApiCalls: meshData.performance?.productsApiCalls,
          categoriesApiCalls: meshData.performance?.categoriesApiCalls,
          inventoryApiCalls: meshData.performance?.inventoryApiCalls,
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
