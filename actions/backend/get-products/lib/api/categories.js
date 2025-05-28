/**
 * Category-related API calls to Adobe Commerce
 * @module lib/api/categories
 */
const { http: { buildHeaders } } = require('../../../../src/core');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../../src/commerce/api/integration');
const endpoints = require('./commerce-endpoints');

// Optimal values for category operations
const CATEGORY_BATCH_SIZE = 20;
const REQUEST_RETRIES = 2;
const RETRY_DELAY = 1000;
const CACHE_TTL = 3600; // 1 hour cache TTL

// In-memory cache for category data
const categoryCache = new Map();

/**
 * Get cached category data
 * @private
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Cached category data or null
 */
function getCachedCategory(categoryId) {
    const cached = categoryCache.get(categoryId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
        return cached.data;
    }
    if (cached) {
        categoryCache.delete(categoryId);
    }
    return null;
}

/**
 * Cache category data
 * @private
 * @param {string} categoryId - Category ID
 * @param {Object} data - Category data
 */
function cacheCategory(categoryId, data) {
    categoryCache.set(categoryId, {
        timestamp: Date.now(),
        data
    });
}

/**
 * Extract category IDs from a product
 * @param {Object} product - Product object
 * @returns {string[]} Array of category IDs
 */
function getCategoryIds(product) {
    const categoryIds = new Set();
    
    // Check category_ids array
    if (Array.isArray(product.category_ids)) {
        product.category_ids.forEach(id => categoryIds.add(String(id)));
    }
    
    // Check extension_attributes.category_links
    if (Array.isArray(product.extension_attributes?.category_links)) {
        product.extension_attributes.category_links.forEach(link => {
            if (link.category_id) {
                categoryIds.add(String(link.category_id));
            }
        });
    }
    
    return Array.from(categoryIds);
}

/**
 * Process categories in parallel with retries
 * @private
 * @param {string[]} categoryIds - Array of category IDs
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Array of category results
 */
async function processCategoriesParallel(categoryIds, token, params) {
    const batchPromises = categoryIds.map(async (categoryId) => {
        // Check cache first
        const cached = getCachedCategory(categoryId);
        if (cached) {
            return { id: categoryId, ...cached };
        }

        let retryCount = 0;
        while (retryCount < REQUEST_RETRIES) {
            try {
                const response = await makeCommerceRequest(
                    buildCommerceUrl(params.COMMERCE_URL, endpoints.category(categoryId)),
                    {
                        method: 'GET',
                        headers: buildHeaders(token)
                    }
                );

                if (response.statusCode === 200) {
                    const category = {
                        id: categoryId,
                        name: response.body.name,
                        path: response.body.path,
                        level: response.body.level,
                        parent_id: response.body.parent_id,
                        children: response.body.children
                    };
                    
                    // Cache the result
                    cacheCategory(categoryId, category);
                    return category;
                }
                
                console.warn(`Failed to fetch category ${categoryId} - Status: ${response.statusCode}`);
                return null;
            } catch (error) {
                retryCount++;
                if (retryCount < REQUEST_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
        }
        console.warn(`Failed to fetch category ${categoryId} after ${REQUEST_RETRIES} retries`);
        return null;
    });

    const results = await Promise.all(batchPromises);
    return results.filter(Boolean);
}

/**
 * Process categories in batches with parallel execution
 * @private
 * @param {string[]} categoryIds - Array of category IDs to process
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Map of category IDs to category objects
 */
async function processCategoriesInBatches(categoryIds, token, params) {
    const results = {};
    
    for (let i = 0; i < categoryIds.length; i += CATEGORY_BATCH_SIZE) {
        const batchIds = categoryIds.slice(i, i + CATEGORY_BATCH_SIZE);
        
        // Process batch in parallel
        const batchResults = await processCategoriesParallel(batchIds, token, params);
        
        // Add successful results to map
        batchResults.forEach(category => {
            if (category) {
                results[category.id] = category;
            }
        });

        // Add small delay between batches to prevent rate limiting
        if (i + CATEGORY_BATCH_SIZE < categoryIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

/**
 * Builds a map of category IDs to category names with caching
 * @param {Array<Object>} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Map of category IDs to names
 */
async function buildCategoryMap(products, token, params) {
    // Get all category IDs from all products and deduplicate them
    const allCategoryIds = products.flatMap(product => getCategoryIds(product));
    const categoryIds = [...new Set(allCategoryIds)];
    
    // Check cache for all categories first
    const cachedCategories = {};
    const uncachedIds = categoryIds.filter(id => {
        const cached = getCachedCategory(id);
        if (cached) {
            cachedCategories[id] = cached;
            return false;
        }
        return true;
    });
    
    if (uncachedIds.length > 0) {
        const newCategories = await processCategoriesInBatches(uncachedIds, token, params);
        
        // Merge cached and new categories
        return {
            ...cachedCategories,
            ...newCategories
        };
    }
    
    return cachedCategories;
}

module.exports = {
    getCategoryIds,
    buildCategoryMap
}; 