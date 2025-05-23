/**
 * Caching module for Adobe Commerce API responses
 * @module lib/api/cache
 */

/**
 * In-memory cache store with TTL support
 * @private
 * @type {Map<string, {data: any, timestamp: number}>}
 */
const cache = new Map();

/**
 * Default TTL for cached items (1 hour)
 * @private
 * @constant
 */
const DEFAULT_TTL = 3600000;

/**
 * Cache configuration for different types of data
 * @private
 * @constant
 */
const CACHE_CONFIG = {
  category: {
    ttl: 3600000, // 1 hour
    keyPrefix: 'category:'
  }
};

/**
 * Builds a cache key for a specific data type and identifier
 * @private
 * @param {string} type - Type of data (e.g., 'category')
 * @param {string} id - Unique identifier for the data
 * @returns {string} Cache key
 */
function buildKey(type, id) {
  const config = CACHE_CONFIG[type];
  if (!config) {
    throw new Error(`Unknown cache type: ${type}`);
  }
  return `${config.keyPrefix}${id}`;
}

/**
 * Gets data from cache if available and not expired
 * @param {string} type - Type of data to cache (e.g., 'category')
 * @param {string} id - Unique identifier for the data
 * @returns {any|null} Cached data or null if not found/expired
 */
function get(type, id) {
  const key = buildKey(type, id);
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  const config = CACHE_CONFIG[type];
  const now = Date.now();
  
  // Check if cached data has expired
  if (now - cached.timestamp > config.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Stores data in cache with TTL
 * @param {string} type - Type of data to cache (e.g., 'category')
 * @param {string} id - Unique identifier for the data
 * @param {any} data - Data to cache
 */
function set(type, id, data) {
  const key = buildKey(type, id);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clears all cached data of a specific type
 * @param {string} type - Type of data to clear (e.g., 'category')
 */
function clear(type) {
  const config = CACHE_CONFIG[type];
  if (!config) {
    throw new Error(`Unknown cache type: ${type}`);
  }
  
  // Delete all entries with matching prefix
  for (const key of cache.keys()) {
    if (key.startsWith(config.keyPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Gets multiple items from cache
 * @param {string} type - Type of data to get (e.g., 'category')
 * @param {string[]} ids - Array of unique identifiers
 * @returns {Object} Object mapping ids to cached values (missing/expired items omitted)
 */
function getMulti(type, ids) {
  return ids.reduce((result, id) => {
    const data = get(type, id);
    if (data !== null) {
      result[id] = data;
    }
    return result;
  }, {});
}

/**
 * Stores multiple items in cache
 * @param {string} type - Type of data to cache (e.g., 'category')
 * @param {Object<string, any>} items - Object mapping ids to values
 */
function setMulti(type, items) {
  Object.entries(items).forEach(([id, data]) => {
    set(type, id, data);
  });
}

module.exports = {
  get,
  set,
  clear,
  getMulti,
  setMulti
}; 