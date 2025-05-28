/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

/**
 * @typedef {Object} ActionParams
 * @property {string} COMMERCE_URL - Adobe Commerce instance URL
 * @property {string} COMMERCE_ADMIN_USERNAME - Admin username for authentication
 * @property {string} COMMERCE_ADMIN_PASSWORD - Admin password for authentication
 * @property {string} [LOG_LEVEL='info'] - Logging level
 * @property {string} [fields] - Comma-separated list of fields to include
 * @property {boolean} [include_inventory=true] - Whether to include inventory data
 * @property {boolean} [include_categories=true] - Whether to include category data
 * @property {string} [env] - Environment setting ('dev' or 'prod')
 */

/**
 * @typedef {Object} ProductData
 * @property {string} sku - Product SKU
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {Object} [inventory] - Inventory information
 * @property {number} inventory.qty - Available quantity
 * @property {Array<string>} [categories] - Array of category paths
 */

/**
 * @typedef {Object} CategoryMap
 * @property {string} id - Category ID
 * @property {string} name - Category name
 * @property {string} path - Full category path
 * @property {Array<string>} breadcrumbs - Category breadcrumb trail
 */

/**
 * @typedef {Object} StorageResult
 * @property {string} fileName - Name of the stored file
 * @property {string} downloadUrl - URL to download the file
 */

/**
 * @typedef {Object} SuccessResponse
 * @property {number} statusCode - HTTP status code (200)
 * @property {Object} body - Response body
 * @property {boolean} body.success - Success indicator
 * @property {string} body.message - Success message
 * @property {Object} [body.file] - File information (production only)
 * @property {string} body.file.downloadUrl - Download URL for the file
 * @property {Array<string>} body.steps - Processing steps executed
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {number} statusCode - HTTP status code (4xx or 5xx)
 * @property {Object} body - Response body
 * @property {string} body.error - Error message
 * @property {string} [body.details] - Error details (development only)
 * @property {Array<string>} body.steps - Processing steps before error
 */


const { 
    http: { 
        extractActionParams,
        createResponseHandlerState, 
        addStep, 
        createSuccessResponse, 
    },
    monitoring: { 
        performance: { processInBatches },
        errors: { handleError }
    }
} = require('../../../src/core');
const { getAuthToken } = require('./lib/auth');
const { fetchAllProducts, enrichWithInventory } = require('./lib/api/products');
const { buildCategoryMap } = require('./lib/api/categories');
const { transform: { product: { buildProductObject } } } = require('../../../src/commerce');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');
const { default: ora } = require('ora');

// Constants for memory optimization
const PRODUCT_BATCH_SIZE = 200;
const GC_THRESHOLD = 50 * 1024 * 1024;

// Default fields to include in export
const DEFAULT_FIELDS = [
    'sku',
    'name',
    'price',
    'status',
    'visibility',
    'type_id',
    'created_at',
    'updated_at'
];

/**
 * Main action handler for get-products
 * @param {Object} rawParams - Raw action parameters from OpenWhisk
 * @returns {Promise<SuccessResponse|ErrorResponse>} Action response
 */
async function main(rawParams) {
    const startTime = performance.now();
    let spinner = ora().start();
    
    // Extract parameters and initialize response handler
    const params = extractActionParams(rawParams);
    const isDev = (rawParams.__ow_query && rawParams.__ow_query.env === 'dev') || rawParams.env === 'dev';
    const responseState = createResponseHandlerState({ isDev });
    
    try {
        // Step 1: Get authentication token
        spinner.text = 'Authenticating...';
        const token = await getAuthToken(params);
        spinner = await updateProgress(spinner, 'Authentication successful');
        let state = addStep(responseState, 'Authentication successful');

        // Step 2: Fetch products with pagination
        spinner.text = 'Fetching products...';
        const products = await fetchAllProducts(token, params);
        spinner = await updateProgress(spinner, `Fetched ${products.length} products`);
        state = addStep(state, `Fetched ${products.length} products from Adobe Commerce`);

        // Step 3: Enrich with inventory data
        spinner.text = 'Enriching with inventory data...';
        const productsWithInventory = await enrichWithInventory(products, token, params);
        spinner = await updateProgress(spinner, `Successfully enriched ${productsWithInventory.length} products with inventory data`);
        state = addStep(state, `Enriched ${productsWithInventory.length} products with inventory data`);

        // Step 4: Build category map if needed
        let categoryMap = {};
        if (params.include_categories) {
            spinner.text = 'Building category map...';
            categoryMap = await buildCategoryMap(productsWithInventory, token, params);
            spinner = await updateProgress(spinner, `Built category map with ${Object.keys(categoryMap).length} categories`);
            state = addStep(state, `Built category map with ${Object.keys(categoryMap).length} categories`);
        }

        // Step 5: Transform products
        spinner.text = 'Transforming products...';
        const transformedProducts = await processInBatches(productsWithInventory, async (product) => {
            return buildProductObject(product, {
                categoryMap,
                fields: params.fields ? params.fields.split(',') : DEFAULT_FIELDS
            });
        }, {
            batchSize: PRODUCT_BATCH_SIZE,
            gcThreshold: GC_THRESHOLD,
            onProgress: (progress) => {
                spinner.text = `Transforming products... ${progress.percentage}%`;
            }
        });
        spinner = await updateProgress(spinner, `Transformed ${transformedProducts.length} products`);
        state = addStep(state, `Transformed ${transformedProducts.length} products`);

        // Step 6: Generate CSV
        spinner.text = 'Generating CSV...';
        const csvResult = await createCsv(transformedProducts);
        spinner = await updateProgress(spinner, 'Generated CSV file');
        state = addStep(state, 'Generated CSV file');

        // Step 7: Store CSV if not in development mode
        let fileInfo = null;
        if (!isDev) {
            spinner.text = 'Storing CSV...';
            fileInfo = await storeCsv(csvResult);
            spinner = await updateProgress(spinner, 'Stored CSV file');
            state = addStep(state, 'Stored CSV file');
        }

        // Create success response
        const endTime = performance.now();
        const response = createSuccessResponse(state, {
            message: 'Successfully exported products',
            file: fileInfo,
            metrics: {
                processingTime: endTime - startTime,
                productCount: products.length,
                categoryCount: Object.keys(categoryMap).length,
                csvSize: csvResult.stats.size,
                compressionRatio: csvResult.stats.compressionRatio
            }
        });

        spinner.succeed('Export completed successfully');
        return response;

    } catch (error) {
        if (spinner) {
            await spinner.fail(error.message);
        }
        return handleError(responseState, error);
    }
}

/**
 * Update spinner progress
 * @private
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Progress text
 * @returns {Promise<Object>} Updated spinner
 */
async function updateProgress(spinner, text) {
    await spinner.succeed(text);
    return spinner.start();
}

exports.main = main;
