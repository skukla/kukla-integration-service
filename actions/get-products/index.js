/**
 * Adobe App Builder Action: Export Adobe Commerce product data to CSV
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { fetchAndEnrichProducts } = require('../../lib/commerce');
const { createCsv, buildProducts } = require('../../lib/csv');
const { storeCsv } = require('../../lib/storage');
const {
  errorResponse,
  successResponse,
  checkMissingRequestInputs,
  formatFileSize,
} = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('get-products', { level: params.LOG_LEVEL || 'info' });
  const steps = [];
  const startTime = Date.now();

  try {
    // Validate required parameters using Adobe standard
    const requiredParams = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    steps.push('✔ Validated input parameters');
    logger.info('Starting product export', { useCase: params.useCase });

    // Step 1: Fetch and enrich products
    const config = createConfig(params);
    const result = await fetchAndEnrichProducts(params, config);
    steps.push(
      `✔ Fetched and enriched ${result.products.length} products (${result.apiCalls.total} API calls)`
    );
    logger.info('Fetched and enriched products', {
      count: result.products.length,
      apiCalls: result.apiCalls.total,
    });

    // Step 2: Build products with proper transformation
    const builtProducts = await buildProducts(result.products);
    steps.push(`✔ Built ${builtProducts.length} products for export`);
    logger.info('Built products', { count: builtProducts.length });

    // Step 3: Create CSV
    const csvData = await createCsv(builtProducts);
    steps.push(`✔ Created CSV (${formatFileSize(csvData.content.length)})`);
    logger.info('Created CSV', { size: csvData.content.length });

    // Step 4: Store CSV file
    const storageResult = await storeCsv(csvData.content, config);

    if (!storageResult.stored) {
      const errorMsg = `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`;
      return errorResponse(500, errorMsg, logger);
    }

    steps.push(`✔ Stored CSV to ${storageResult.provider}`);
    logger.info('Stored CSV successfully', { provider: storageResult.provider });

    // Return Adobe standard response format with actual API call metrics
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
          method: 'REST API',
          productCount: builtProducts.length,
          apiCalls: result.apiCalls.total,
          dataSourcesUnified: 3,
          executionTime: Date.now() - startTime,
          productsApiCalls: result.apiCalls.products,
          categoriesApiCalls: result.apiCalls.categories,
          inventoryApiCalls: result.apiCalls.inventory,
        },
      },
      'Product export completed successfully',
      logger
    );
  } catch (error) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
