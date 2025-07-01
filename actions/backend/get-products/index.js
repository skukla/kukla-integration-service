/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */
const buildProducts = require('./steps/buildProducts');
const createCsv = require('./steps/createCsv');
const fetchAndEnrichProducts = require('./steps/fetchAndEnrichProducts');
const storeCsv = require('./steps/storeCsv');
const validateInput = require('./steps/validateInput');
const { loadConfig } = require('../../../config');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { createTraceContext, traceStep } = require('../../../src/core/tracing');
const { formatStepMessage } = require('../../../src/core/utils');

/**
 * Main action handler for get-products
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
    const trace = createTraceContext('get-products', actionParams);
    const steps = [];

    // Step 1: Validate input
    steps.push(formatStepMessage('validate-input', 'success'));

    // Step 2: Fetch and enrich products
    const products = await traceStep(trace, 'fetch-products', async () => {
      return await fetchAndEnrichProducts(actionParams, config);
    });
    steps.push(formatStepMessage('fetch-and-enrich', 'success', { count: products.length }));

    // Sort products by SKU for consistent output
    products.sort((a, b) => a.sku.localeCompare(b.sku));

    // Step 3: Build product data
    const builtProducts = await traceStep(trace, 'build-products', async () => {
      return await buildProducts(products);
    });
    steps.push(formatStepMessage('build-products', 'success', { count: builtProducts.length }));

    // Check format parameter to determine response type
    const format = actionParams.format || 'csv';

    if (format === 'json') {
      // Return JSON format for API Mesh integration
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
            apiCalls: trace.metrics?.apiCalls || 200,
            method: 'REST API',
          },
        },
        'Product data retrieved successfully',
        {}
      );
    }

    // Default CSV format
    // Step 4: Create CSV
    const csvData = await traceStep(trace, 'create-csv', async () => {
      return await createCsv(builtProducts);
    });
    steps.push(formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

    // Step 5: Store CSV
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
          apiCalls: trace.metrics?.apiCalls || 200, // Estimate based on typical REST API calls
          method: 'REST API',
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
