/**
 * Real Category-related API calls to Adobe Commerce (OpenWhisk Compatible)
 * @module lib/api/categories
 *
 * This version uses direct HTTP calls instead of makeCommerceRequest to avoid OpenWhisk conflicts
 */
const endpoints = require('./commerce-endpoints');
const { loadConfig } = require('../../../../../config');
const { request, buildHeaders } = require('../../../../../src/core/http/client');
const { buildCommerceUrl } = require('../../../../../src/core/routing');

// Load configuration
const config = loadConfig();
const {
  category: {
    batchSize: BATCH_SIZE = 20,
    requestRetries: REQUEST_RETRIES = 2,
    retryDelay: RETRY_DELAY = 1000,
    cacheTtl: CACHE_TTL = 3600,
  } = {},
} = config;

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
 * Get category details by ID with retries
 * @param {string} categoryId - Category ID
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object|null>} Category details or null if failed
 */
async function getCategory(categoryId, token, params) {
  // Check cache first
  const cached = getCachedCategory(categoryId);
  if (cached) {
    return cached;
  }

  let retryCount = 0;
  while (retryCount < REQUEST_RETRIES) {
    try {
      const endpoint = endpoints.category(categoryId);
      const url = buildCommerceUrl(params.COMMERCE_URL, endpoint);
      const response = await request(url, {
        method: 'GET',
        headers: buildHeaders(token),
      });

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
      console.warn(`Attempt ${retryCount + 1} failed for category ${categoryId}:`, error.message);
      retryCount++;
      if (retryCount < REQUEST_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  return null;
}

/**
 * Enrich products with real category data
 * @param {Object[]} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Products enriched with category data
 */
async function enrichProductsWithCategories(products, token, params) {
  try {
    // Create a map to store category details
    const categoryMap = new Map();

    // Get unique category IDs from all products
    const categoryIds = new Set();
    products.forEach((product) => {
      if (Array.isArray(product.category_ids)) {
        product.category_ids.forEach((id) => categoryIds.add(String(id)));
      }
    });

    // Fetch category details for each unique ID (limit concurrent requests)
    const categoryArray = Array.from(categoryIds);
    for (let i = 0; i < categoryArray.length; i += BATCH_SIZE) {
      const batch = categoryArray.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (categoryId) => {
        try {
          const category = await getCategory(categoryId, token, params);
          if (category) {
            categoryMap.set(categoryId, category);
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}:`, error.message);
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < categoryArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Enrich products with category data
    return products.map((product) => ({
      ...product,
      categories: Array.isArray(product.category_ids)
        ? product.category_ids
            .map((id) => {
              const category = categoryMap.get(String(id));
              return category ? { id: category.id, name: category.name } : null;
            })
            .filter(Boolean)
        : [],
    }));
  } catch (error) {
    console.error('Error enriching products with categories:', error.message);
    // Fallback: return products with simple category mapping
    return products.map((product) => ({
      ...product,
      categories: Array.isArray(product.category_ids)
        ? product.category_ids.map((id) => ({ id, name: `Category ${id}` }))
        : [],
    }));
  }
}

/**
 * Builds a map of category IDs to category names with caching
 * @param {Array<Object>} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Map of category IDs to names
 */
async function buildCategoryMap(products, token, params) {
  const categoryMap = {};

  // Get unique category IDs from all products
  const categoryIds = new Set();
  products.forEach((product) => {
    const ids = getCategoryIds(product);
    ids.forEach((id) => categoryIds.add(id));
  });

  // Fetch categories in batches
  const categoryArray = Array.from(categoryIds);
  for (let i = 0; i < categoryArray.length; i += BATCH_SIZE) {
    const batch = categoryArray.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (categoryId) => {
      try {
        const category = await getCategory(categoryId, token, params);
        if (category) {
          categoryMap[categoryId] = category.name;
        }
      } catch (error) {
        console.warn(`Failed to fetch category ${categoryId}:`, error.message);
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches
    if (i + BATCH_SIZE < categoryArray.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return categoryMap;
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
  const response = await request(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to fetch categories: ${JSON.stringify(response.body)}`);
  }

  return response.body;
}

module.exports = {
  getCategoryIds,
  buildCategoryMap,
  enrichProductsWithCategories,
  getCategory,
  getCategories,
};
