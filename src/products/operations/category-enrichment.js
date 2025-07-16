/**
 * Category Enrichment Operations
 *
 * Mid-level business logic for enriching products with category data.
 * Contains operations for fetching category data and enriching products with category names.
 */

const { executeAdminTokenCommerceRequest } = require('../../commerce/operations/api-requests');
const { extractCategoryIds } = require('../utils/category');
const { getCategoryIds } = require('../utils/data');

/**
 * Fetch category data from Commerce API in batches
 *
 * This function implements intelligent batch processing with concurrency control
 * to efficiently fetch category data. It handles large numbers of categories by:
 *
 * 1. Grouping category IDs into configurable batches (default: 20)
 * 2. Limiting concurrent requests per batch (default: 15)
 * 3. Adding configurable delays between chunks to prevent rate limiting
 * 4. Gracefully handling individual category fetch failures
 *
 * @param {Set} categoryIds - Set of unique category IDs to fetch
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object>} Map of category ID to category data
 */
async function fetchCategoryData(categoryIds, config, params, trace = null) {
  const categoryMap = {};

  if (!categoryIds || categoryIds.size === 0) {
    return categoryMap;
  }

  const batchSize = config.commerce.batching.categories;
  const requestDelay = config.performance.batching.requestDelay;
  const maxConcurrent = config.performance.batching.maxConcurrent;

  const categoryArray = Array.from(categoryIds);

  // Process in batches with configurable concurrency
  for (let i = 0; i < categoryArray.length; i += batchSize) {
    const batch = categoryArray.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const categoryPromises = chunk.map(async (categoryId) => {
        try {
          const response = await executeAdminTokenCommerceRequest(
            `/categories/${categoryId}`,
            { method: 'GET' },
            config,
            params,
            trace
          );

          if (response.body) {
            categoryMap[categoryId] = {
              id: response.body.id,
              name: response.body.name,
              parent_id: response.body.parent_id,
              level: response.body.level,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}: ${error.message}`);
          categoryMap[categoryId] = { id: categoryId, name: 'Unknown Category' };
        }
      });

      await Promise.all(categoryPromises);

      // Add configurable delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return categoryMap;
}

/**
 * Enrich products with category data
 * Pure function that adds category information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} categoryMap - Map of category ID to category data
 * @returns {Array} Array of products enriched with categories
 */
function enrichProductsWithCategories(products, categoryMap) {
  return products.map((product) => ({
    ...product,
    categories: getCategoryIds(product)
      .map((id) => categoryMap[String(id)])
      .filter(Boolean),
  }));
}

/**
 * Enrich products with category data
 * Composition function that combines extraction, fetching, and enrichment.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with categories
 */
async function enrichWithCategories(products, config, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Extract category IDs from all products
    const categoryIds = extractCategoryIds(products);
    if (categoryIds.size === 0) {
      return products;
    }

    // Step 2: Fetch category data from Commerce API
    const categoryMap = await fetchCategoryData(categoryIds, config, params, trace);

    // Step 3: Enrich products with category data
    return enrichProductsWithCategories(products, categoryMap);
  } catch (error) {
    console.warn(`Category enrichment failed: ${error.message}`);
    return products; // Return products without category enrichment
  }
}

module.exports = {
  fetchCategoryData,
  enrichProductsWithCategories,
  enrichWithCategories,
};
