/**
 * Caching Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

const cacheStore = new Map();
const DEFAULT_CACHE_TTL = 300000; // 5 minutes

/**
 * Get cached item with TTL check
 */
function getCachedItem(key, ttl = DEFAULT_CACHE_TTL) {
  const cached = cacheStore.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  if (cached) {
    cacheStore.delete(key);
  }

  return null;
}

/**
 * Cache item with timestamp
 */
function cacheItem(key, data) {
  cacheStore.set(key, {
    timestamp: Date.now(),
    data: data,
  });
}

/**
 * Get cached category by ID
 */
function getCachedCategory(categoryId, ttl = DEFAULT_CACHE_TTL) {
  return getCachedItem('category_' + categoryId, ttl);
}

/**
 * Cache category data
 */
function cacheCategory(categoryId, data) {
  cacheItem('category_' + categoryId, data);
}

/**
 * Build category map from cache for given IDs
 */
function buildCategoryMapFromCache(categoryIds, ttl = DEFAULT_CACHE_TTL) {
  const categoryMap = {};
  categoryIds.forEach((id) => {
    const cached = getCachedCategory(id, ttl);
    if (cached) {
      categoryMap[id] = cached;
    }
  });
  return categoryMap;
}

/**
 * Clear all cached items
 */
function clearCache() {
  cacheStore.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

module.exports = {
  getCachedItem,
  cacheItem,
  getCachedCategory,
  cacheCategory,
  buildCategoryMapFromCache,
  clearCache,
  getCacheStats,
  DEFAULT_CACHE_TTL,
};
