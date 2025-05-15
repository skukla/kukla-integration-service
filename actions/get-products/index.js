const dotenv = require('dotenv');
const path = require('path');
const { Core } = require('@adobe/aio-sdk');
const validateInput = require('./steps/validateInput');
const fetchAndEnrichProducts = require('./steps/fetchAndEnrichProducts');
const buildProducts = require('./steps/buildProducts');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  const steps = [];

  try {
    logger.info('Calling the main action');
    
    logger.info('Received parameters:', {
      COMMERCE_URL: params.COMMERCE_URL,
      COMMERCE_ADMIN_USERNAME: params.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: params.COMMERCE_ADMIN_PASSWORD ? '***' : undefined
    });

    // Step 1: Validate input
    steps.push(await validateInput(params));

    // Step 2: Fetch and enrich products
    const { products, productsWithInventory, categoryMap } = await fetchAndEnrichProducts(params, logger);
    steps.push(`Fetched ${products.length} products from the external API.`);
    steps.push('Enriched products with inventory data.');
    steps.push(`Built category map with ${Object.keys(categoryMap).length} categories.`);

    // Step 3: Build product objects
    const productsWithCategories = buildProducts(productsWithInventory, categoryMap);
    steps.push(`Constructed ${productsWithCategories.length} product objects for CSV export.`);

    // Step 4: Generate CSV in memory
    const { fileName, content } = await createCsv(productsWithCategories);
    steps.push('Generated CSV content in memory.');

    // Step 5: Store CSV
    const storageResult = await storeCsv(content, fileName);
    steps.push(`Stored CSV file in ${storageResult.location} as "${storageResult.fileName}".`);

    // Return response with human-readable steps
    return {
      statusCode: 200,
      body: {
        message: 'Product export completed successfully.',
        file: storageResult,
        steps
      }
    };
  } catch (error) {
    logger.error('Error in main action:', error);
    steps.push(`Error: ${error.message || error.toString()}`);
    return { statusCode: 500, body: { error: 'server error', steps } };
  }
}

exports.main = main;
