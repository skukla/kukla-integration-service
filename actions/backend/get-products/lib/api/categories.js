/**
 * Category-related API calls to Adobe Commerce
 * @module lib/api/categories
 */
const endpoints = require('./commerce-endpoints');
const { loadConfig } = require('../../../../../config');
const { makeCommerceRequest } = require('../../../../../src/commerce/api/integration');
const {
  http: { buildHeaders },
  routing: { buildCommerceUrl },
  cache,
} = require('../../../../../src/core');

// Load configuration with proper destructuring
const {
  category: {
    batchSize: BATCH_SIZE,
    requestRetries: REQUEST_RETRIES,
    retryDelay: RETRY_DELAY,
    cacheTtl: CACHE_TTL,
  },
} = loadConfig();

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
    data,
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
    product.category_ids.forEach((id) => categoryIds.add(String(id)));
  }
  // Check extension_attributes.category_links
  if (Array.isArray(product.extension_attributes?.category_links)) {
    product.extension_attributes.category_links.forEach((link) => {
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
            headers: buildHeaders(token),
          }
        );
        if (response.statusCode === 200) {
          const category = {
            id: categoryId,
            name: response.body.name,
            path: response.body.path,
            level: response.body.level,
            parent_id: response.body.parent_id,
            children: response.body.children,
          };
          // Cache the result
          cacheCategory(categoryId, category);
          return category;
        }
        return null;
      } catch (error) {
        retryCount++;
        if (retryCount < REQUEST_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
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

  for (let i = 0; i < categoryIds.length; i += BATCH_SIZE) {
    const batchIds = categoryIds.slice(i, i + BATCH_SIZE);
    // Process batch in parallel
    const batchResults = await processCategoriesParallel(batchIds, token, params);
    // Add successful results to map
    batchResults.forEach((category) => {
      if (category) {
        results[category.id] = category;
      }
    });
    // Add small delay between batches to prevent rate limiting
    if (i + BATCH_SIZE < categoryIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
  const allCategoryIds = products.flatMap((product) => getCategoryIds(product));
  const categoryIds = [...new Set(allCategoryIds)];
  // Check cache for all categories first
  const cachedCategories = {};
  const uncachedIds = categoryIds.filter((id) => {
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
      ...newCategories,
    };
  }
  return cachedCategories;
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
 * Get category details by ID
 * @param {string} categoryId - Category ID
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Category details
 */
async function getCategory(categoryId, token, params) {
  const url = buildCommerceUrl(params.COMMERCE_URL, endpoints.category(categoryId));
  const response = await makeCachedRequest(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });
  if (response.statusCode !== 200) {
    throw new Error(`Failed to fetch category ${categoryId}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

/**
 * Enrich products with category data
 * @param {Object[]} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Products enriched with category data
 */
async function enrichProductsWithCategories(products, token, params) {
  // Create a map to store category details
  const categoryMap = new Map();
  // Get unique category IDs from all products
  const categoryIds = new Set();
  products.forEach((product) => {
    if (Array.isArray(product.category_ids)) {
      product.category_ids.forEach((id) => categoryIds.add(id));
    }
  });
  // Fetch category details for each unique ID
  await Promise.all(
    Array.from(categoryIds).map(async (categoryId) => {
      try {
        const category = await getCategory(categoryId, token, params);
        categoryMap.set(categoryId, category.name);
      } catch (error) {
        console.warn(`Failed to fetch category ${categoryId}:`, error.message);
      }
    })
  );
  // Enrich products with category names
  return products.map((product) => ({
    ...product,
    categories: Array.isArray(product.category_ids)
      ? product.category_ids.map((id) => categoryMap.get(id)).filter(Boolean)
      : [],
  }));
}

/**
 * Fetches all categories from Adobe Commerce
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Array of category objects
 */
async function getCategories(token, params) {
  const { COMMERCE_URL } = params;
  if (!COMMERCE_URL) {
    throw new Error('COMMERCE_URL is required');
  }

  const endpoint = endpoints.categoryList();
  const url = buildCommerceUrl(COMMERCE_URL, endpoint);
  const response = await makeCommerceRequest(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  return response.body;
}

module.exports = {
  getCategoryIds,
  buildCategoryMap,
  enrichProductsWithCategories,
  getCategory,
  getCategories,
};
