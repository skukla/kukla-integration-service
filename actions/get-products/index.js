/**
 * Adobe App Builder Action: Export Adobe Commerce product data to CSV
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { fetchAndEnrichProducts, buildProducts } = require('../business-logic');
const { createCsv } = require('../csv');
const { storeCsv } = require('../storage');
const { errorResponse, checkMissingRequestInputs } = require('../utils');

async function main(params) {
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters using Adobe standard
    const requiredParams = [];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting product export', { useCase: params.useCase });

    // Step 1: Fetch and enrich products
    const config = createConfig(params);
    const productData = await fetchAndEnrichProducts(params, config);
    logger.info('Fetched and enriched products', { count: productData.length });

    // Step 2: Build products with proper transformation
    const builtProducts = await buildProducts(productData);
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
        message: 'Product export completed successfully',
        downloadUrl: storageResult.downloadUrl,
        storage: {
          provider: storageResult.provider,
          location: storageResult.fileName,
          properties: storageResult.properties,
          management: storageResult.management,
        },
        performance: {
          productCount: builtProducts.length,
          csvSize: csvData.content.length,
          storage: storageResult.provider,
        },
      },
    };
  } catch (error) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
