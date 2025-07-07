/**
 * File Storage Caching
 * @module files/cache
 * @description Caching utilities for file storage operations
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
    HTTP: 'http',
  },

  // HTTP cache control directives
  HTTP: {
    NO_CACHE: 'no-cache, no-store, must-revalidate',
    PUBLIC: 'public',
    PRIVATE: 'private',
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
        Pragma: 'no-cache',
        Expires: '0',
      };
    }

    const directives = [isPublic ? CacheConfig.HTTP.PUBLIC : CacheConfig.HTTP.PRIVATE];

    if (maxAge) {
      directives.push(`max-age=${maxAge}`);
    }

    return {
      'Cache-Control': directives.join(', '),
    };
  },

  /**
   * Gets appropriate cache duration for content type
   * @param {string} contentType - Content type of the response
   * @returns {number} Cache duration in seconds
   */
  getDuration(contentType) {
    if (
      contentType.includes('image/') ||
      contentType.includes('font/') ||
      contentType.includes('text/css') ||
      contentType.includes('application/javascript')
    ) {
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
      noCache: options.noCache,
    });

    return {
      ...response,
      headers: {
        ...response.headers,
        ...cacheHeaders,
      },
    };
  },
};

/**
 * File-specific cache utilities
 */
const FileCache = {
  /**
   * Creates a cache key for a file
   * @param {string} fileName - File name
   * @param {string} [operation='read'] - Operation type
   * @returns {string} Cache key
   */
  createKey(fileName, operation = 'read') {
    return `file:${operation}:${fileName}`;
  },

  /**
   * Caches file metadata
   * @param {string} fileName - File name
   * @param {Object} metadata - File metadata
   */
  setMetadata(fileName, metadata) {
    const key = this.createKey(fileName, 'metadata');
    MemoryCache.set(key, metadata);
  },

  /**
   * Gets cached file metadata
   * @param {string} fileName - File name
   * @param {Object} [options] - Cache options
   * @returns {Object|null} Cached metadata or null
   */
  getMetadata(fileName, options = {}) {
    const key = this.createKey(fileName, 'metadata');
    return MemoryCache.get(key, options);
  },

  /**
   * Caches file content
   * @param {string} fileName - File name
   * @param {Buffer|string} content - File content
   */
  setContent(fileName, content) {
    const key = this.createKey(fileName, 'content');
    MemoryCache.set(key, content);
  },

  /**
   * Gets cached file content
   * @param {string} fileName - File name
   * @param {Object} [options] - Cache options
   * @returns {Buffer|string|null} Cached content or null
   */
  getContent(fileName, options = {}) {
    const key = this.createKey(fileName, 'content');
    return MemoryCache.get(key, options);
  },

  /**
   * Invalidates cache for a file
   * @param {string} fileName - File name
   */
  invalidate(fileName) {
    const metadataKey = this.createKey(fileName, 'metadata');
    const contentKey = this.createKey(fileName, 'content');

    MemoryCache.clear(metadataKey);
    MemoryCache.clear(contentKey);
  },
};

module.exports = {
  CacheConfig,
  MemoryCache,
  HttpCache,
  FileCache,
};
