/**
 * Core storage caching module
 * @module core/storage/cache
 */

/**
 * Cache configuration
 * @enum {Object}
 */
const CacheConfig = {
  // Cache durations in seconds
  DURATION: {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 3600,        // 1 hour
    VERY_LONG: 86400   // 24 hours
  },

  // Cache storage types
  STORAGE: {
    MEMORY: 'memory',
    HTTP: 'http'
  },

  // HTTP cache control directives
  HTTP: {
    NO_CACHE: 'no-cache, no-store, must-revalidate',
    PUBLIC: 'public',
    PRIVATE: 'private'
  }
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
      timestamp: Math.floor(Date.now() / 1000)
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
  }
};

/**
 * HTTP Cache API
 */
const HttpCache = {
  /**
   * Generates cache control headers
   * @param {Object} options - Cache options
   * @param {number} [options.maxAge] - Max age in seconds
   * @param {boolean} [options.public=false] - Whether response is publicly cacheable
   * @param {boolean} [options.noCache=false] - Whether to prevent caching
   * @returns {Object} Headers object with cache control directives
   */
  getHeaders(options = {}) {
    const { maxAge, public: isPublic = false, noCache = false } = options;

    if (noCache) {
      return {
        'Cache-Control': CacheConfig.HTTP.NO_CACHE,
        'Pragma': 'no-cache',
        'Expires': '0'
      };
    }

    const directives = [
      isPublic ? CacheConfig.HTTP.PUBLIC : CacheConfig.HTTP.PRIVATE
    ];

    if (maxAge) {
      directives.push(`max-age=${maxAge}`);
    }

    return {
      'Cache-Control': directives.join(', ')
    };
  },

  /**
   * Gets appropriate cache duration for content type
   * @param {string} contentType - Content type of the response
   * @returns {number} Cache duration in seconds
   */
  getDuration(contentType) {
    if (contentType.includes('image/') || 
        contentType.includes('font/') ||
        contentType.includes('text/css') ||
        contentType.includes('application/javascript')) {
      return CacheConfig.DURATION.VERY_LONG;
    }

    if (contentType.includes('text/html')) {
      return CacheConfig.DURATION.SHORT;
    }

    return CacheConfig.DURATION.MEDIUM;
  },

  /**
   * Adds cache headers to a response
   * @param {Object} response - Response object
   * @param {Object} options - Cache options
   * @returns {Object} Response with cache headers
   */
  addHeaders(response, options = {}) {
    const contentType = response.headers?.['Content-Type'] || 'text/html';
    const duration = options.maxAge || this.getDuration(contentType);
    
    const cacheHeaders = this.getHeaders({
      maxAge: duration,
      public: options.public,
      noCache: options.noCache
    });

    return {
      ...response,
      headers: {
        ...response.headers,
        ...cacheHeaders
      }
    };
  }
};

module.exports = {
  CacheConfig,
  MemoryCache,
  HttpCache
}; 