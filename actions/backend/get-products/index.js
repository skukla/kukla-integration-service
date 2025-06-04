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

/**
 * Format file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Round to 2 decimal places
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

/**
 * Format step message for API response
 * @param {string} name - Step name
 * @param {string} status - Step status (success/error)
 * @param {Object} details - Step details
 * @returns {string} Formatted step message
 */
function formatStepMessage(name, status, details = {}) {
  const stepMessages = {
    'extract-params': {
      success: 'Successfully extracted and validated action parameters',
      error: 'Failed to extract action parameters',
    },
    'validate-input': {
      success: 'Successfully validated Commerce API credentials and URL',
      error: 'Failed to validate input parameters',
    },
    'fetch-and-enrich': {
      success: (count) => `Successfully fetched and enriched ${count} products with category data`,
      error: 'Failed to fetch products from Commerce API',
    },
    'build-products': {
      success: (count) => `Successfully transformed ${count} products for export`,
      error: 'Failed to transform product data',
    },
    'create-csv': {
      success: (size) => `Successfully generated CSV file (${formatFileSize(size)})`,
      error: 'Failed to generate CSV file',
    },
    'store-csv': {
      success: (info) => {
        const size = parseInt(info.properties.size) || info.properties.size;
        const formattedSize = typeof size === 'number' ? formatFileSize(size) : size;
        return `Successfully stored CSV file as ${info.fileName} (${formattedSize})`;
      },
      error: 'Failed to store CSV file',
    },
  };

  return status === 'success'
    ? typeof stepMessages[name][status] === 'function'
      ? stepMessages[name][status](details.count || details.size || details.info)
      : stepMessages[name][status]
    : `${stepMessages[name][status]}: ${details.error || ''}`;
}

/**
 * Main action handler for get-products
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  // Handle preflight requests first
  if (params.__ow_method === 'options') {
    return response.success({}, 'Preflight success', {}, params);
  }

  const trace = createTraceContext('get-products', params);
  const steps = [];

  try {
    // Extract and normalize parameters
    const actionParams = await traceStep(trace, 'extract-params', async () => {
      const result = await extractActionParams(params);
      steps.push(formatStepMessage('extract-params', 'success'));
      return result;
    });

    // Load configuration with Commerce URL and credentials
    const config = loadConfig(actionParams);
    const commerceUrl = actionParams.COMMERCE_URL || config.url.commerce.baseUrl;

    // Use Commerce URL from config if not provided in params
    const enrichedParams = {
      ...actionParams,
      COMMERCE_URL: commerceUrl,
    };

    // Step 1: Validate input parameters
    try {
      await traceStep(trace, 'validate-input', async () => {
        if (!commerceUrl) {
          throw new Error('COMMERCE_URL is required for product export');
        }
        await validateInput(enrichedParams);
        steps.push(formatStepMessage('validate-input', 'success'));
      });
    } catch (error) {
      steps.push(formatStepMessage('validate-input', 'error', { error: error.message }));
      return response.badRequest(error.message, { steps }, params);
    }

    // Step 2: Fetch and enrich products
    let products;
    try {
      products = await traceStep(trace, 'fetch-and-enrich', async () => {
        const enrichedProducts = await fetchAndEnrichProducts(enrichedParams);
        steps.push(
          formatStepMessage('fetch-and-enrich', 'success', { count: enrichedProducts.length })
        );
        return enrichedProducts;
      });
    } catch (error) {
      steps.push(formatStepMessage('fetch-and-enrich', 'error', { error: error.message }));
      return response.error(error, { steps }, params);
    }

    // Step 3: Build product data structure
    let productData;
    try {
      productData = await traceStep(trace, 'build-products', async () => {
        const result = await buildProducts(products);
        steps.push(formatStepMessage('build-products', 'success', { count: result.length }));
        return result;
      });
    } catch (error) {
      steps.push(formatStepMessage('build-products', 'error', { error: error.message }));
      return response.error(error, { steps }, params);
    }

    // Step 4: Create CSV file
    let csvContent;
    try {
      csvContent = await traceStep(trace, 'create-csv', async () => {
        const result = await createCsv(productData);
        const size = typeof result === 'string' ? result.length : result.content.length;
        steps.push(formatStepMessage('create-csv', 'success', { size }));
        return result;
      });
    } catch (error) {
      steps.push(formatStepMessage('create-csv', 'error', { error: error.message }));
      return response.error(error, { steps }, params);
    }

    // Step 5: Store CSV in cloud storage
    let fileInfo;
    try {
      fileInfo = await traceStep(trace, 'store-csv', async () => {
        const result = await storeCsv(csvContent);
        steps.push(formatStepMessage('store-csv', 'success', { info: result }));
        return result;
      });
    } catch (error) {
      steps.push(formatStepMessage('store-csv', 'error', { error: error.message }));
      return response.error(error, { steps }, params);
    }

    return response.success({ file: fileInfo }, steps[steps.length - 1], { steps }, params);
  } catch (error) {
    return response.error(error, { steps }, params);
  }
}

module.exports = {
  main,
};
