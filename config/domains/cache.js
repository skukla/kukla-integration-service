/**
 * Cache Domain Configuration
 * @module config/domains/cache
 *
 * Used by: All actions for caching strategies and configuration
 * ⚙️ Key settings: Cache TTL, stale-while-revalidate, cache invalidation
 */

/**
 * Build caching configurations
 * @returns {Object} Caching configuration
 */
function buildCachingConfig() {
  return {
    memory: {
      enabled: true,
      maxSize: '50MB',
      ttl: 300000, // 5 minutes
    },
    response: {
      enabled: true,
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400, // 24 hours
    },
    // Source-specific cache configurations
    sources: {
      products: {
        ttl: 1800, // 30 minutes - products change less frequently
        staleWhileRevalidate: 3600, // 1 hour stale tolerance
        maxAge: 1800,
      },
      categories: {
        ttl: 3600, // 1 hour - categories change infrequently
        staleWhileRevalidate: 7200, // 2 hours stale tolerance
        maxAge: 3600,
      },
      inventory: {
        ttl: 300, // 5 minutes - inventory changes frequently
        staleWhileRevalidate: 900, // 15 minutes stale tolerance
        maxAge: 300,
      },
    },
    // Cache invalidation strategies
    invalidation: {
      patterns: ['products', 'categories', 'inventory'],
      webhooks: {
        enabled: true,
        endpoints: ['/cache/invalidate'],
      },
    },
  };
}

module.exports = {
  buildCachingConfig,
};
