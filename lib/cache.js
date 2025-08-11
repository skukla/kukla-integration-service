/**
 * Adobe I/O State Caching for Commerce API Responses
 * Simple caching layer following Adobe standards
 */

const crypto = require('crypto');

const stateLib = require('@adobe/aio-lib-state');

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
async function getCachedData(state, endpoint, params, token, enabled) {
  if (!enabled) return null;

  const key = generateCacheKey(endpoint, params, token);

  if (state) {
    try {
      const cached = await state.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isValidData(parsed, endpoint)) {
          return parsed;
        }
        await state.delete(key);
      }
    } catch (error) {
      // Continue to memory cache
    }
  }

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
 * Cache data to Adobe I/O State and memory
 * @param {Object} state - Adobe I/O State instance
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {*} data - Data to cache
 * @param {boolean} enabled - Whether caching is enabled
 * @param {number} ttl - Time to live in seconds
 */
async function cacheData(state, endpoint, params, token, data, enabled, ttl) {
  if (!enabled || !isValidData(data, endpoint)) return;

  const key = generateCacheKey(endpoint, params, token);
  const expires = Date.now() + ttl * 1000;
  const serializedData = JSON.stringify(data);

  if (state) {
    try {
      await state.put(key, serializedData, { ttl });
    } catch (error) {
      // Continue to memory cache
    }
  }

  memoryCache.set(key, { data, expires });
}

/**
 * Invalidate cached data
 * @param {Object} state - Adobe I/O State instance
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {boolean} enabled - Whether caching is enabled
 */
async function invalidateCache(state, endpoint, params, token, enabled) {
  if (!enabled) return;

  const key = generateCacheKey(endpoint, params, token);

  if (state) {
    try {
      await state.delete(key);
    } catch (error) {
      // Continue to memory cache
    }
  }

  memoryCache.delete(key);
}

/**
 * Create cache instance with Adobe I/O State
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Cache instance
 */
async function createCache(params, config, logger) {
  const enabled = !config.cache.bypassCache;
  let state = null;

  if (enabled) {
    try {
      state = await stateLib.init();
      logger.info('Cache initialized successfully', { stateAvailable: !!state });
    } catch (error) {
      logger.error('Cache initialization failed, falling back to memory cache', {
        error: error.message,
      });
    }
  } else {
    logger.info('Cache bypassed via configuration');
  }

  return {
    state,
    enabled,
    config,
    get: (endpoint, params, token) => getCachedData(state, endpoint, params, token, enabled),
    put: (endpoint, params, token, data, ttl = config.cache.apiResponseTtl) =>
      cacheData(state, endpoint, params, token, data, enabled, ttl),
    invalidate: (endpoint, params, token) =>
      invalidateCache(state, endpoint, params, token, enabled),
  };
}

module.exports = {
  createCache,
};
