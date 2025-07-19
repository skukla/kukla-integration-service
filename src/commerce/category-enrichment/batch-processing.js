/**
 * Category Enrichment - Batch Processing Sub-module
 * All category data fetching and batch processing utilities
 */

const { executeAuthenticatedCommerceRequest } = require('../admin-token-auth');

// Batch Processing Workflows

/**
 * Intelligent category data fetching with advanced batching and concurrency control
 * @purpose Coordinate category data fetching with configurable batching, concurrency limits, and error recovery
 * @param {Set} categoryIds - Set of unique category IDs to fetch from Commerce API
 * @param {Object} config - Configuration object with batching and performance settings
 * @param {Object} params - Action parameters containing admin credentials for API requests
 * @param {Object} [trace=null] - Optional trace context for performance monitoring
 * @param {Object} [options={}] - Fetching options including retry strategies and error handling
 * @returns {Promise<Object>} Map of category ID to complete category data with metadata
 * @throws {Error} When critical API failures occur or authentication errors prevent access
 * @usedBy enrichProductsWithCategoriesAndFallback
 */
async function fetchCategoryDataWithBatching(
  categoryIds,
  config,
  params,
  trace = null,
  options = {}
) {
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
        return await fetchSingleCategoryWithRetry(categoryId, config, params, trace, options);
      });

      const chunkResults = await Promise.allSettled(categoryPromises);

      // Process settled promises and collect results
      chunkResults.forEach((result, index) => {
        const categoryId = chunk[index];
        if (result.status === 'fulfilled' && result.value) {
          categoryMap[categoryId] = result.value;
        } else {
          console.warn(
            `Failed to fetch category ${categoryId}: ${result.reason?.message || 'Unknown error'}`
          );
          categoryMap[categoryId] = createFallbackCategoryData(categoryId, options);
        }
      });

      // Add configurable delay between chunks to prevent rate limiting
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return categoryMap;
}

// Batch Processing Utilities

/**
 * Fetch single category with intelligent retry logic
 * @purpose Retrieve individual category data with configurable retry strategies and error handling
 * @param {string} categoryId - Category ID to fetch from Commerce API
 * @param {Object} config - Configuration object with API settings
 * @param {Object} params - Action parameters with credentials
 * @param {Object} [trace=null] - Optional trace context
 * @param {Object} [options={}] - Retry and error handling options
 * @returns {Promise<Object|null>} Category data or null if fetch fails
 * @usedBy fetchCategoryDataWithBatching
 */
async function fetchSingleCategoryWithRetry(
  categoryId,
  config,
  params,
  trace = null,
  options = {}
) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const categoryUrl = `${config.commerce.baseUrl}/rest/V1/categories/${categoryId}`;

      if (trace && trace.incrementApiCalls) {
        trace.incrementApiCalls();
      }

      const response = await executeAuthenticatedCommerceRequest(
        categoryUrl,
        { method: 'GET' },
        config,
        params,
        trace
      );

      if (response && response.id) {
        return response;
      }

      throw new Error(`Invalid category response for ID ${categoryId}`);
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(
          `Failed to fetch category ${categoryId} after ${maxRetries} attempts:`,
          error.message
        );
        return null;
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return null;
}

/**
 * Create fallback category data
 * @purpose Generate fallback category object when API fetch fails
 * @param {string} categoryId - Category ID for fallback data
 * @param {Object} [options={}] - Fallback generation options
 * @returns {Object} Fallback category data object
 * @usedBy fetchCategoryDataWithBatching
 */
function createFallbackCategoryData(categoryId, options = {}) {
  return {
    id: categoryId,
    name: options.fallbackName || `Category ${categoryId}`,
    parent_id: null,
    level: 0,
    is_active: true,
    path: `1/${categoryId}`,
    isFallback: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

module.exports = {
  // Workflows
  fetchCategoryDataWithBatching,

  // Utilities
  fetchSingleCategoryWithRetry,
  createFallbackCategoryData,
};
