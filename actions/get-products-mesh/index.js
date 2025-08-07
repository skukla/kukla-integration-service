/**
 * Adobe App Builder Action: Export Adobe Commerce product data via API Mesh
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { getProductsFromMesh } = require('../../lib/commerce');
const { createCsv } = require('../../lib/csv');
const { storeCsv } = require('../../lib/storage');
const {
  errorResponse,
  successResponse,
  checkMissingRequestInputs,
  formatFileSize,
} = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('get-products-mesh', { level: params.LOG_LEVEL || 'info' });
  const steps = [];
  const startTime = Date.now();

  try {
    // Validate required parameters (including Commerce admin credentials)
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

    steps.push('✔ Validated input parameters and Commerce admin credentials');
    logger.info('Starting mesh product export', { useCase: params.useCase });

    // Step 1: Fetch products from API Mesh
    const config = createConfig(params);
    const meshData = await getProductsFromMesh(params, config);
    steps.push(`✔ Fetched ${meshData.products.length} enriched products via API Mesh`);
    logger.info('Fetched products from mesh', { count: meshData.products.length });

    // Step 2: Create CSV
    const csvData = await createCsv(meshData.products);
    steps.push(`✔ Created CSV (${formatFileSize(csvData.content.length)})`);
    logger.info('Created CSV', { size: csvData.content.length });

    // Step 3: Store CSV file
    const storageResult = await storeCsv(csvData.content, config);

    if (!storageResult.stored) {
      const errorMsg = `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`;
      return errorResponse(500, errorMsg, logger);
    }

    steps.push(`✔ Stored CSV to ${storageResult.provider}`);
    logger.info('Stored CSV successfully', { provider: storageResult.provider });

    // Return Adobe standard response format with actual mesh metrics
    return successResponse(
      {
        steps,
        downloadUrl: storageResult.downloadUrl,
        storage: {
          provider: storageResult.provider,
          location: storageResult.fileName,
          properties: storageResult.properties,
          management: storageResult.management,
        },
        performance: {
          method: meshData.performance.method || 'API Mesh',
          productCount: meshData.performance.productCount || meshData.products.length,
          executionTime: Date.now() - startTime,
          apiCalls: meshData.performance.apiCalls || 1,
          dataSourcesUnified: meshData.performance.dataSourcesUnified || 3,
          productsApiCalls: meshData.performance.productsApiCalls || 1,
          categoriesApiCalls: meshData.performance.categoriesApiCalls || 1,
          inventoryApiCalls:
            meshData.performance.inventoryApiCalls || meshData.performance.inventoryApiCalls,
        },
      },
      'Mesh product export completed successfully',
      logger
    );
  } catch (error) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
