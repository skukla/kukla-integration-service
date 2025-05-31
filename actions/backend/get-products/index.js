/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

const { buildProducts } = require('./steps/buildProducts');
const { createCsv } = require('./steps/createCsv');
const { fetchAndEnrichProducts } = require('./steps/fetchAndEnrichProducts');
const { storeCsv } = require('./steps/storeCsv');
const { validateInput } = require('./steps/validateInput');
const { extractActionParams } = require('../../../src/core/http/client');
const { createTraceContext, traceStep, formatTrace } = require('../../../src/core/tracing');

/**
 * Main action handler for get-products
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const trace = createTraceContext('get-products', params);

  try {
    console.log('Starting get-products action with params:', JSON.stringify(params, null, 2));

    // Extract and normalize parameters
    const actionParams = await traceStep(trace, 'extract-params', () =>
      extractActionParams(params)
    );
    console.log('Normalized action params:', JSON.stringify(actionParams, null, 2));

    // Step 1: Validate input parameters
    try {
      await traceStep(trace, 'validate-input', () => validateInput(actionParams));
    } catch (error) {
      console.error('Input validation failed:', error);
      const traceData = formatTrace(trace);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Input validation failed: ${error.message}`,
          trace: traceData,
        },
      };
    }

    // Step 2: Fetch and enrich products
    let products;
    try {
      products = await traceStep(trace, 'fetch-and-enrich', () =>
        fetchAndEnrichProducts(actionParams)
      );
      console.log(`Fetched ${products.length} products`);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      const traceData = formatTrace(trace);
      return {
        statusCode: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Failed to fetch products: ${error.message}`,
          details: error.body,
          trace: traceData,
        },
      };
    }

    // Step 3: Build product data structure
    let productData;
    try {
      productData = await traceStep(trace, 'build-products', () =>
        buildProducts(products, actionParams)
      );
      console.log(`Built data structure for ${productData.length} products`);
    } catch (error) {
      console.error('Failed to build product data:', error);
      const traceData = formatTrace(trace);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Failed to build product data: ${error.message}`,
          trace: traceData,
        },
      };
    }

    // Step 4: Create CSV file
    let csvContent;
    try {
      csvContent = await traceStep(trace, 'create-csv', () => createCsv(productData));
      console.log('CSV file created successfully');
    } catch (error) {
      console.error('Failed to create CSV:', error);
      const traceData = formatTrace(trace);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Failed to create CSV: ${error.message}`,
          trace: traceData,
        },
      };
    }

    // Step 5: Store CSV in cloud storage
    let fileInfo;
    try {
      fileInfo = await traceStep(trace, 'store-csv', () => storeCsv(csvContent, actionParams));
      console.log('CSV file stored successfully:', fileInfo);
    } catch (error) {
      console.error('Failed to store CSV:', error);
      const traceData = formatTrace(trace);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Failed to store CSV: ${error.message}`,
          trace: traceData,
        },
      };
    }

    const traceData = formatTrace(trace);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        message: 'Product export completed successfully',
        file: fileInfo,
        trace: traceData,
      },
    };
  } catch (error) {
    console.error('Unhandled error in get-products action:', error);
    const traceData = formatTrace(trace);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        error: error.message,
        details: error.body,
        trace: traceData,
      },
    };
  }
}

module.exports = {
  main,
};
