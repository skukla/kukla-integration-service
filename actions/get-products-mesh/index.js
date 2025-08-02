/**
 * Adobe App Builder Action: Export Adobe Commerce product data via API Mesh
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { fetchEnrichedProductsFromMesh, buildProducts } = require('../business-logic');
const { createCsv } = require('../csv');
const { storeCsv } = require('../storage');
const { errorResponse, checkMissingRequestInputs } = require('../utils');

async function main(params) {
  const logger = Core.Logger('get-products-mesh', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters
    const requiredParams = [];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting mesh product export', { useCase: params.useCase });

    // Step 1: Fetch products from API Mesh
    const config = createConfig(params);
    const meshData = await fetchEnrichedProductsFromMesh(config, params);
    logger.info('Fetched products from mesh', { count: meshData.products.length });

    // Step 2: Build products with proper transformation
    const builtProducts = await buildProducts(meshData.products);
    logger.info('Built products', { count: builtProducts.length });

    // Step 3: Create CSV
    const csvData = await createCsv(builtProducts);
    logger.info('Created CSV', { size: csvData.content.length });

    // Step 4: Store CSV file
    const storageResult = await storeCsv(csvData.content, config, params);

    if (!storageResult.stored) {
      const errorMsg = `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`;
      return errorResponse(500, errorMsg, logger);
    }

    logger.info('Stored CSV successfully', { provider: storageResult.provider });

    // Return Adobe standard response format
    return {
      statusCode: 200,
      body: {
        message: 'Mesh product export completed successfully',
        downloadUrl: storageResult.downloadUrl,
        storage: {
          provider: storageResult.provider,
          location: storageResult.fileName,
          properties: storageResult.properties,
          management: storageResult.management,
        },
        performance: meshData.performance,
      },
    };
  } catch (error) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
