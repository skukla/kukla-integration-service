/**
 * Shared Cache Infrastructure
 * @module shared/cache
 * @description Universal caching utilities for cross-domain use
 */

/**
 * Cache configuration
 * @enum {Object}
 */
const CacheConfig = {
  // Cache durations in seconds
  DURATION: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Cache storage types
  STORAGE: {
    MEMORY: 'memory',
  },
};

/**
 * In-memory cache store
 * @private
 * @type {Map<string, {data: any, timestamp: number, type: string}>}
 */
const memoryCache = new Map();

/**
 * Memory Cache API
 */
const MemoryCache = {
  /**
   * Gets data from memory cache if available and not expired
   * @param {string} key - Cache key
   * @param {Object} [options] - Cache options
   * @param {number} [options.ttl] - Time to live in seconds
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(key, options = {}) {
    const cached = memoryCache.get(key);
    if (!cached) return null;

    const ttl = options.ttl || CacheConfig.DURATION.MEDIUM;
    const now = Math.floor(Date.now() / 1000);

    if (now - cached.timestamp > ttl) {
      memoryCache.delete(key);
      return null;
    }

    return cached.data;
  },

  /**
   * Stores data in memory cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    memoryCache.set(key, {
      data,
      timestamp: Math.floor(Date.now() / 1000),
    });
  },

  /**
   * Clears data from memory cache
   * @param {string} [key] - Specific key to clear, or all if not provided
   */
  clear(key) {
    if (key) {
      memoryCache.delete(key);
    } else {
      memoryCache.clear();
    }
  },

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    };
  },
};

module.exports = {
  CacheConfig,
  MemoryCache,
};
