/**
 * Adobe I/O State Caching for Commerce API Responses
 * Simple state-based caching following Adobe standards
 */

const crypto = require('crypto');

const stateLib = require('@adobe/aio-lib-state');

/**
 * Generate cache key from endpoint, params and token
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @returns {string} Generated cache key
 */
function generateCacheKey(endpoint, params) {
  // For admin_token endpoint, use a simpler key without token hash
  if (endpoint === 'admin_token') {
    const paramsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 8);
    return `commerce_${endpoint}_${paramsHash}`;
  }

  // For other endpoints, don't include token in key since we always use same admin
  // This allows cache to work across different token values for same admin user
  const paramsHash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex')
    .substring(0, 8);
  return `commerce_${endpoint}_${paramsHash}`;
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
 * Get cached data from Adobe I/O State
 * @param {Object} state - Adobe I/O State instance
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {boolean} enabled - Whether caching is enabled
 * @returns {Promise<*>} Cached data or null
 */
async function getCachedData(state, endpoint, params, token, enabled) {
  if (!enabled || !state) return null;

  const key = generateCacheKey(endpoint, params, token);

  try {
    const cached = await state.get(key);

    if (cached) {
      // Adobe I/O State wraps the value in {value: "..."}
      const rawValue = cached.value;

      let parsedData;
      try {
        if (endpoint === 'admin_token') {
          // Admin token is stored as a string and should stay a string
          parsedData = rawValue;
        } else {
          // Other data is stored as JSON string and needs parsing
          parsedData = JSON.parse(rawValue);
        }
      } catch (e) {
        return null;
      }

      if (isValidData(parsedData, endpoint)) {
        return parsedData;
      }
    }
  } catch (error) {
    // Cache miss or error - return null
  }

  return null;
}

/**
 * Cache data to Adobe I/O State
 * @param {Object} state - Adobe I/O State instance
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters
 * @param {string} token - Auth token
 * @param {*} data - Data to cache
 * @param {boolean} enabled - Whether caching is enabled
 * @param {number} ttl - Time to live in seconds
 */
async function cacheData(state, endpoint, params, token, data, enabled, ttl) {
  if (!enabled || !state || !isValidData(data, endpoint)) return;

  const key = generateCacheKey(endpoint, params, token);

  try {
    const valueToStore = typeof data === 'string' ? data : JSON.stringify(data);
    await state.put(key, valueToStore, { ttl });
  } catch (error) {
    // Silently fail on cache write errors
  }
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
  if (!enabled || !state) return;

  const key = generateCacheKey(endpoint, params, token);

  try {
    await state.delete(key);
  } catch (error) {
    // Silently fail on cache delete errors
  }
}

/**
 * Create cache instance with Adobe I/O State
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Cache instance
 */
async function createCache(params, config, logger) {
  let state = null;

  // Always try to initialize cache - override will disable if needed
  try {
    state = await stateLib.init();

    // Check cache override BEFORE using cache
    try {
      const cacheOverride = await state.get('cache_override');
      if (cacheOverride?.value === 'disabled') {
        logger.warn('⚠️ Cache override active - caching disabled');
        return {
          state: null,
          enabled: false,
          config,
          get: () => null,
          put: () => {},
          delete: () => {},
        };
      }
    } catch (overrideError) {
      // If we can't check cache override, proceed with normal caching
      logger.debug('Could not check cache override, proceeding normally');
    }

    logger.info('Adobe I/O State cache initialized successfully');
  } catch (error) {
    logger.error('State cache initialization failed', {
      error: error.message,
    });
    // Return cache object with state = null, effectively disabling caching
  }

  return {
    state,
    enabled: !!state,
    config,
    get: (endpoint, params, token) => getCachedData(state, endpoint, params, token, !!state),
    put: (endpoint, params, token, data, ttl = config.cache.apiResponseTtl) =>
      cacheData(state, endpoint, params, token, data, !!state, ttl),
    delete: (endpoint, params, token) => invalidateCache(state, endpoint, params, token, !!state),
  };
}

module.exports = {
  createCache,
};
