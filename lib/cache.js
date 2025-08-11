/**
 * Memory-Only Caching for Commerce API Responses
 * Simplified caching layer using only memory (Adobe I/O State has corruption issues)
 */

const crypto = require('crypto');

const memoryCache = new Map();

/**
 * Generate cache key from endpoint, params and token
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @returns {string} Generated cache key
 */
function generateCacheKey(endpoint, params, token) {
  const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
  const tokenHash = crypto.createHash('md5').update(tokenString).digest('hex').substring(0, 8);
  const paramsHash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex')
    .substring(0, 8);
  return `commerce_${endpoint}_${paramsHash}_${tokenHash}`;
}

/**
 * Validate cached data structure
 * @param {*} data - Data to validate
 * @param {string} endpoint - Endpoint type for validation
 * @returns {boolean} Whether data is valid
 */
function isValidData(data, endpoint) {
  if (!data) return false;

  if (endpoint === 'admin_token') {
    return typeof data === 'string' && data.length > 10;
  }

  if (typeof data === 'object' && data.items) {
    return Array.isArray(data.items);
  }

  return true;
}

/**
 * Get cached data from Adobe I/O State or memory fallback
 * @param {Object} state - Adobe I/O State instance
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {boolean} enabled - Whether caching is enabled
 * @returns {Promise<*>} Cached data or null
 */
async function getCachedData(endpoint, params, token, enabled) {
  if (!enabled) return null;

  const key = generateCacheKey(endpoint, params, token);

  const memCached = memoryCache.get(key);
  if (memCached && memCached.expires > Date.now()) {
    if (isValidData(memCached.data, endpoint)) {
      return memCached.data;
    }
    memoryCache.delete(key);
  } else if (memCached) {
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Cache data to memory only
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {*} data - Data to cache
 * @param {boolean} enabled - Whether caching is enabled
 * @param {number} ttl - Time to live in seconds
 */
async function cacheData(endpoint, params, token, data, enabled, ttl) {
  if (!enabled || !isValidData(data, endpoint)) return;

  const key = generateCacheKey(endpoint, params, token);
  const expires = Date.now() + ttl * 1000;

  memoryCache.set(key, { data, expires });
}

/**
 * Invalidate cached data from memory
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {boolean} enabled - Whether caching is enabled
 */
async function invalidateCache(endpoint, params, token, enabled) {
  if (!enabled) return;

  const key = generateCacheKey(endpoint, params, token);
  memoryCache.delete(key);
}

/**
 * Create memory-only cache instance
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Cache instance
 */
async function createCache(params, config, logger) {
  const enabled = !config.cache.bypassCache;

  if (enabled) {
    logger.info('Memory cache initialized successfully');
  } else {
    logger.info('Cache bypassed via configuration');
  }

  return {
    enabled,
    config,
    get: (endpoint, params, token) => getCachedData(endpoint, params, token, enabled),
    put: (endpoint, params, token, data, ttl = config.cache.apiResponseTtl) =>
      cacheData(endpoint, params, token, data, enabled, ttl),
    delete: (endpoint, params, token) => invalidateCache(endpoint, params, token, enabled),
  };
}

module.exports = {
  createCache,
};
