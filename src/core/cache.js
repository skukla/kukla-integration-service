/**
 * Core caching utilities
 * @module actions/core/cache
 */

/**
 * Cache configuration
 * @enum {Object}
 */
const CacheConfig = {
  // Browser cache durations (in seconds)
  DURATIONS: {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 3600,         // 1 hour
    VERY_LONG: 86400    // 24 hours
  },
  
  // Cache control directives
  DIRECTIVES: {
    NO_CACHE: 'no-cache, no-store, must-revalidate',
    PUBLIC: 'public',
    PRIVATE: 'private'
  }
};

/**
 * Generates cache control headers based on configuration
 * @param {Object} options - Cache options
 * @param {number} [options.maxAge] - Max age in seconds
 * @param {boolean} [options.public=false] - Whether the response is publicly cacheable
 * @param {boolean} [options.noCache=false] - Whether to prevent caching
 * @returns {Object} Headers object with cache control directives
 */
function getCacheHeaders(options = {}) {
  const {
    maxAge,
    public: isPublic = false,
    noCache = false
  } = options;

  // If no-cache is specified, return no-cache headers
  if (noCache) {
    return {
      'Cache-Control': CacheConfig.DIRECTIVES.NO_CACHE,
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  // Build cache control directive
  const directives = [
    isPublic ? CacheConfig.DIRECTIVES.PUBLIC : CacheConfig.DIRECTIVES.PRIVATE
  ];

  // Add max-age if specified
  if (maxAge) {
    directives.push(`max-age=${maxAge}`);
  }

  return {
    'Cache-Control': directives.join(', ')
  };
}

/**
 * Determines appropriate cache duration based on content type
 * @param {string} contentType - Content type of the response
 * @returns {number} Cache duration in seconds
 */
function getCacheDuration(contentType) {
  // Static assets can be cached longer
  if (contentType.includes('image/') || 
      contentType.includes('font/') ||
      contentType.includes('text/css') ||
      contentType.includes('application/javascript')) {
    return CacheConfig.DURATIONS.VERY_LONG;
  }

  // HTML content should have shorter cache
  if (contentType.includes('text/html')) {
    return CacheConfig.DURATIONS.SHORT;
  }

  // Default to medium duration
  return CacheConfig.DURATIONS.MEDIUM;
}

/**
 * Adds appropriate cache headers to a response
 * @param {Object} response - Response object
 * @param {Object} options - Cache options
 * @returns {Object} Response with cache headers
 */
function addCacheHeaders(response, options = {}) {
  const contentType = response.headers?.['Content-Type'] || 'text/html';
  const duration = options.maxAge || getCacheDuration(contentType);
  
  const cacheHeaders = getCacheHeaders({
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

module.exports = {
  CacheConfig,
  getCacheHeaders,
  getCacheDuration,
  addCacheHeaders
}; 