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
const { incrementApiCalls } = require('../../../../../src/core/tracing');

// In-memory cache for category data
const categoryCache = new Map();

/**
 * Get cached category data
 * @private
 * @param {string} categoryId - Category ID
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object|null} Cached category data or null
 */
function getCachedCategory(categoryId, params = {}) {
  const config = loadConfig(params);
  const cached = categoryCache.get(categoryId);
  if (cached && Date.now() - cached.timestamp < config.categories.cacheTimeout * 1000) {
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
  // Check custom_attributes for category_ids
  if (Array.isArray(product.custom_attributes)) {
    product.custom_attributes.forEach((attr) => {
      if (attr.attribute_code === 'category_ids' && Array.isArray(attr.value)) {
        attr.value.forEach((id) => categoryIds.add(String(id)));
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
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object|null>} Category details or null if failed
 */
async function getCategory(categoryId, token, params, trace = null) {
  const config = loadConfig(params);
  // Check cache first
  const cached = getCachedCategory(categoryId, params);
  if (cached) {
    return cached;
  }

  let retryCount = 0;
  while (retryCount < config.categories.retries) {
    try {
      const endpoint = endpoints.category(categoryId);
      const url = buildCommerceUrl(config.commerce.baseUrl, endpoint);

      // Track API call if trace context is provided
      if (trace) {
        incrementApiCalls(trace);
      }

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
      if (retryCount < config.categories.retries) {
        await new Promise((resolve) => setTimeout(resolve, config.categories.retryDelay));
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
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object[]>} Products enriched with category data
 */
async function enrichProductsWithCategories(products, token, params, trace = null) {
  try {
    const config = loadConfig(params);
    // Create a map to store category details
    const categoryMap = new Map();

    // Get unique category IDs from all products
    const categoryIds = new Set();
    products.forEach((product) => {
      // Check direct category_ids
      if (Array.isArray(product.category_ids)) {
        product.category_ids.forEach((id) => categoryIds.add(String(id)));
      }
      // Check custom_attributes for category_ids
      if (Array.isArray(product.custom_attributes)) {
        product.custom_attributes.forEach((attr) => {
          if (attr.attribute_code === 'category_ids' && Array.isArray(attr.value)) {
            attr.value.forEach((id) => categoryIds.add(String(id)));
          }
        });
      }
    });

    // Fetch category details for each unique ID (limit concurrent requests)
    const categoryArray = Array.from(categoryIds);
    for (let i = 0; i < categoryArray.length; i += config.categories.batchSize) {
      const batch = categoryArray.slice(i, i + config.categories.batchSize);
      const batchPromises = batch.map(async (categoryId) => {
        try {
          const category = await getCategory(categoryId, token, params, trace);
          if (category) {
            categoryMap.set(categoryId, category);
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}:`, error.message);
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to prevent rate limiting
      if (i + config.categories.batchSize < categoryArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Enrich products with category data
    return products.map((product) => {
      // Get category IDs from all possible sources
      const productCategoryIds = getCategoryIds(product);

      return {
        ...product,
        categories: productCategoryIds
          .map((id) => {
            const category = categoryMap.get(String(id));
            return category ? { id: category.id, name: category.name } : null;
          })
          .filter(Boolean),
      };
    });
  } catch (error) {
    console.error('Error enriching products with categories:', error.message);
    // Fallback: return products with simple category mapping
    return products.map((product) => {
      const productCategoryIds = getCategoryIds(product);
      return {
        ...product,
        categories: productCategoryIds.map((id) => ({ id, name: `Category ${id}` })),
      };
    });
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
  const config = loadConfig(params);
  const categoryMap = {};

  // Get unique category IDs from all products
  const categoryIds = new Set();
  products.forEach((product) => {
    const ids = getCategoryIds(product);
    ids.forEach((id) => categoryIds.add(id));
  });

  // Fetch categories in batches
  const categoryArray = Array.from(categoryIds);
  for (let i = 0; i < categoryArray.length; i += config.categories.batchSize) {
    const batch = categoryArray.slice(i, i + config.categories.batchSize);
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
    if (i + config.categories.batchSize < categoryArray.length) {
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
  const config = loadConfig(params);
  const commerceUrl = config.commerce.baseUrl;

  if (!commerceUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  const endpoint = endpoints.categoryList();
  const url = buildCommerceUrl(commerceUrl, endpoint);
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
