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

const { extractActionParams } = require('../../../src/core/http');
const { createResponseHandlerState, addStep, createSuccessResponse, createErrorResponse, shouldSkipFileOperations } = require('../../../src/core/responses');
const { getAuthToken } = require('./lib/auth');
const { fetchAllProducts, enrichWithInventory } = require('./lib/api/products');
const { buildCategoryMap } = require('./lib/api/categories');
const { buildProductObject, DEFAULT_FIELDS } = require('./lib/product-transformer');
const { performance } = require('perf_hooks');
const createCsv = require('./steps/createCsv');
const storeCsv = require('./steps/storeCsv');
const { default: ora } = require('ora');

// Constants for memory optimization
const PRODUCT_BATCH_SIZE = 200;
const GC_THRESHOLD = 50 * 1024 * 1024;

/**
 * Track memory usage
 * @private
 * @param {Object} metrics - Metrics object to update
 * @param {string} label - Metric label
 */
function trackMemory(metrics, label) {
    const used = process.memoryUsage();
    metrics[label] = {
        heapUsed: used.heapUsed,
        heapTotal: used.heapTotal,
        external: used.external,
        arrayBuffers: used.arrayBuffers
    };
}

/**
 * Process products in batches to optimize memory usage
 * @private
 * @param {Object[]} products - Array of products to process
 * @param {function} processProduct - Function to process a single product
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
async function processProductBatch(products, processProduct, options = {}) {
    const { batchSize = PRODUCT_BATCH_SIZE, onProgress } = options;
    const results = {
        productCount: 0,
        categoryCount: 0,
        processedProducts: []
    };

    const startTime = performance.now();
    const metrics = {
        batches: [],
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        peakMemoryUsage: 0
    };

    for (let i = 0; i < products.length; i += batchSize) {
        const batchStartTime = performance.now();
        const batch = products.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (product) => {
                const result = await processProduct(product);
                results.productCount += result.performance.productCount;
                results.categoryCount += result.performance.categoryCount;
                return result;
            })
        );
        
        results.processedProducts.push(...batchResults);

        // Track batch metrics
        const batchEndTime = performance.now();
        const batchProcessingTime = batchEndTime - batchStartTime;
        const currentMemory = process.memoryUsage().heapUsed;
        
        metrics.batches.push({
            size: batch.length,
            processingTime: batchProcessingTime,
            memoryUsage: currentMemory
        });
        
        metrics.totalProcessingTime += batchProcessingTime;
        metrics.peakMemoryUsage = Math.max(metrics.peakMemoryUsage, currentMemory);

        // Progress callback
        if (onProgress) {
            onProgress({
                total: products.length,
                processed: Math.min(i + batchSize, products.length),
                percentage: Math.round(((i + batchSize) / products.length) * 100),
                currentBatch: {
                    processingTime: batchProcessingTime,
                    memoryUsage: currentMemory
                }
            });
        }

        // Check memory usage and trigger GC if needed
        if (currentMemory > GC_THRESHOLD) {
            global.gc && global.gc();
            console.log(`Garbage collection triggered at ${(currentMemory / 1024 / 1024).toFixed(1)}MB`);
        }

        // Small delay to prevent event loop blocking
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Calculate average processing time
    metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.batches.length;
    results.metrics = metrics;

    return results;
}

// Centralized progress handling
async function updateProgress(spinner, message) {
    if (spinner) {
        await spinner.succeed(message);
        // Add a clear delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    const newSpinner = ora().start();
    // Add a small delay before starting the next step
    await new Promise(resolve => setTimeout(resolve, 150));
    return newSpinner;
}

/**
 * Main action handler for get-products
 * @param {Object} rawParams - Raw action parameters from OpenWhisk
 * @returns {Promise<SuccessResponse|ErrorResponse>} Action response
 */
async function main(rawParams) {
    const startTime = performance.now();
    const metrics = {};
    const memoryUsage = {};
    let spinner = ora().start();
    
    // Extract parameters and initialize response handler
    const params = extractActionParams(rawParams);
    const isDev = (rawParams.__ow_query && rawParams.__ow_query.env === 'dev') || rawParams.env === 'dev';
    const responseState = createResponseHandlerState({ isDev });
    
    try {
        // Record initial memory usage
        memoryUsage.start = process.memoryUsage().heapUsed;

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

        // Record memory after product fetch
        memoryUsage.afterFetch = process.memoryUsage().heapUsed;

        // Step 3: Enrich with inventory data
        spinner.text = 'Enriching with inventory data...';
        const productsWithInventory = await enrichWithInventory(products, token, params);
        spinner = await updateProgress(spinner, `Successfully enriched ${productsWithInventory.length} products with inventory data`);
        state = addStep(state, `Enriched ${productsWithInventory.length} products with inventory data`);

        // Step 4: Build category map
        spinner.text = 'Building category map...';
        const categoryMap = await buildCategoryMap(productsWithInventory, token, params);
        spinner = await updateProgress(spinner, `Built category map with ${Object.keys(categoryMap).length} categories`);
        state = addStep(state, `Built category map with ${Object.keys(categoryMap).length} categories`);

        // Step 5: Transform products
        const transformResults = await processProductBatch(
            productsWithInventory,
            async (product) => buildProductObject(product, DEFAULT_FIELDS, categoryMap)
        );
        
        // Record memory after transformation
        memoryUsage.afterTransform = process.memoryUsage().heapUsed;

        // Skip file operations in development mode
        if (shouldSkipFileOperations(state)) {
            if (spinner) {
                await spinner.succeed('Development mode - skipping file operations');
                // Add final delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            return createSuccessResponse(state, {
                performance: {
                    executionTime: ((performance.now() - startTime) / 1000).toFixed(1),
                    memory: {
                        start: `${(memoryUsage.start / 1024 / 1024).toFixed(1)}MB`,
                        afterFetch: `${(memoryUsage.afterFetch / 1024 / 1024).toFixed(1)}MB`,
                        afterTransform: `${(memoryUsage.afterTransform / 1024 / 1024).toFixed(1)}MB`,
                        peak: `${(Math.max(...Object.values(memoryUsage)) / 1024 / 1024).toFixed(1)}MB`
                    },
                    productCount: transformResults.productCount,
                    categoryCount: transformResults.categoryCount
                }
            });
        }

        // Step 6: Generate compressed CSV file
        spinner.text = 'Generating CSV...';
        const csvResult = await createCsv(transformResults.processedProducts);
        spinner = await updateProgress(spinner, `Generated compressed CSV content (${csvResult.stats.savingsPercent}% size reduction)`);
        state = addStep(state, `Generated compressed CSV content (${csvResult.stats.savingsPercent}% size reduction)`);

        // Record memory after CSV generation
        memoryUsage.afterCsv = process.memoryUsage().heapUsed;

        // Step 7: Store CSV file
        spinner.text = 'Storing CSV file...';
        const storageResult = await storeCsv(csvResult);
        if (spinner) {
            await spinner.succeed(`Stored compressed CSV file as "${storageResult.fileName}"`);
            // Add final delay
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        state = addStep(state, `Stored compressed CSV file as "${storageResult.fileName}"`);

        // Calculate execution time
        const executionTime = ((performance.now() - startTime) / 1000).toFixed(1);

        // Format response
        const response = {
            file: isDev ? null : { downloadUrl: storageResult.downloadUrl },
            message: "Product export completed successfully.",
            steps: state.steps,
            performance: {
                executionTime: `${executionTime}s`,
                compression: csvResult ? csvResult.stats : null,
                memory: {
                    start: `${(memoryUsage.start / 1024 / 1024).toFixed(1)}MB`,
                    afterFetch: `${(memoryUsage.afterFetch / 1024 / 1024).toFixed(1)}MB`,
                    afterTransform: `${(memoryUsage.afterTransform / 1024 / 1024).toFixed(1)}MB`,
                    afterCsv: `${(memoryUsage.afterCsv / 1024 / 1024).toFixed(1)}MB`
                },
                productCount: transformResults.productCount,
                categoryCount: transformResults.categoryCount
            }
        };

        return createSuccessResponse(state, response);
    } catch (error) {
        if (spinner) {
            await spinner.fail(error.message);
        }
        return createErrorResponse(state, error);
    }
}

exports.main = main;
