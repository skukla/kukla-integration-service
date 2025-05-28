/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const { http: { buildHeaders } } = require('../../../../src/core');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../../src/commerce/api/integration');
const { cache } = require('../../../../src/core/cache');
const endpoints = require('./commerce-endpoints');

// Configuration constants
const DEFAULT_PAGE_SIZE = 100;
const INVENTORY_BATCH_SIZE = 20;
const MAX_CONCURRENT_REQUESTS = 10;
const CACHE_TTL = 3600;

/**
 * Process items in batches with concurrency control
 * @private
 * @param {Array} items - Items to process
 * @param {function} processItem - Function to process a single item
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed results
 */
async function processBatch(items, processItem, { batchSize = 10 } = {}) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(processItem);
        
        // Process batch with concurrency limit
        const batchResults = await Promise.all(
            batchPromises.map(p => p.catch(error => ({ error })))
        );
        
        results.push(...batchResults);
        
        // Optional delay between batches to prevent rate limiting
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return results;
}

/**
 * Make a cached request
 * @private
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeCachedRequest(url, options) {
    const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
        return cached;
    }
    
    const response = await makeCommerceRequest(url, options);
    await cache.set(cacheKey, response, CACHE_TTL);
    
    return response;
}

/**
 * Fetch products from Adobe Commerce with pagination
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @param {number} [params.limit] - Maximum number of products to fetch
 * @returns {Promise<Object[]>} Array of product objects
 */
async function fetchAllProducts(token, params) {
    const products = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const url = buildCommerceUrl(params.COMMERCE_URL, endpoints.products({ 
            pageSize: DEFAULT_PAGE_SIZE,
            currentPage
        }));

        const response = await makeCommerceRequest(url, {
            method: 'GET',
            headers: buildHeaders(token)
        });

        if (response.statusCode !== 200) {
            throw new Error(`Failed to fetch products: ${JSON.stringify(response.body)}`);
        }

        const pageProducts = response.body.items || [];
        products.push(...pageProducts);

        // Check if we've reached the limit
        if (params.limit && products.length >= params.limit) {
            return products.slice(0, params.limit);
        }

        // Check if there are more pages
        const totalPages = Math.ceil((response.body.total_count || 0) / DEFAULT_PAGE_SIZE);
        hasMorePages = currentPage < totalPages;
        currentPage++;
    }

    return products;
}

/**
 * Fetch inventory data for a product
 * @param {string} sku - Product SKU
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, token, params) {
    const url = buildCommerceUrl(params.COMMERCE_URL, endpoints.stockItem(sku));
    const response = await makeCachedRequest(url, {
        method: 'GET',
        headers: buildHeaders(token)
    });

    if (response.statusCode === 200 && response.body.items && response.body.items.length > 0) {
        const totalQty = response.body.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const isInStock = response.body.items.some(item => item.status === 1);
        return {
            qty: totalQty,
            is_in_stock: isInStock
        };
    }

    return {
        qty: 0,
        is_in_stock: false
    };
}

/**
 * Enrich products with inventory data using batch processing
 * @param {Object[]} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Products enriched with inventory data
 */
async function enrichWithInventory(products, token, params) {
    // Filter products that need inventory data
    const productsNeedingInventory = products.filter(
        product => product.type_id === 'simple' || product.type_id === 'virtual'
    );

    // Process inventory requests in batches
    const inventoryResults = await processBatch(
        productsNeedingInventory,
        async (product) => {
            try {
                const inventory = await getInventory(product.sku, token, params);
                return { sku: product.sku, inventory };
            } catch (error) {
                return { 
                    sku: product.sku, 
                    inventory: { qty: 0, is_in_stock: false }
                };
            }
        },
        {
            batchSize: INVENTORY_BATCH_SIZE,
            maxConcurrent: MAX_CONCURRENT_REQUESTS
        }
    );

    // Build inventory map from results
    const inventoryMap = inventoryResults.reduce((map, result) => {
        map[result.sku] = result.inventory;
        return map;
    }, {});

    // Enrich all products with inventory data
    const enrichedProducts = products.map(product => ({
        ...product,
        qty: inventoryMap[product.sku]?.qty || 0,
        is_in_stock: inventoryMap[product.sku]?.is_in_stock || false
    }));

    return enrichedProducts;
}

module.exports = {
    fetchAllProducts,
    enrichWithInventory
}; 