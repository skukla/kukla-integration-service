/**
 * Lazy configuration loader utility
 * Provides a uniform approach to configuration loading across all modules
 * @module core/config/lazy-loader
 */

const { loadConfig } = require('../../../config');

/**
 * Configuration cache to avoid repeated loading
 * @private
 */
const configCache = new Map();

/**
 * Creates a lazy configuration getter that loads config only when accessed
 * @param {string} cacheKey - Unique cache key for this configuration
 * @param {Function} [configExtractor] - Function to extract specific config section
 * @returns {Function} Lazy configuration getter function
 */
function createLazyConfigGetter(cacheKey, configExtractor = (config) => config) {
  return function getLazyConfig(params = {}) {
    // Create a cache key that includes parameter hash for Adobe I/O Runtime
    const paramHash = params ? JSON.stringify(Object.keys(params).sort()) : 'default';
    const fullCacheKey = `${cacheKey}-${paramHash}`;

    if (!configCache.has(fullCacheKey)) {
      const config = loadConfig(params);
      const extractedConfig = configExtractor(config);
      configCache.set(fullCacheKey, extractedConfig);
    }

    return configCache.get(fullCacheKey);
  };
}

/**
 * Creates a configuration object with lazy-loaded properties
 * @param {Object} configMap - Map of property names to config extractors
 * @param {Object} [params] - Action parameters for configuration loading
 * @returns {Object} Object with lazy-loaded configuration properties
 */
function createLazyConfigObject(configMap, params = {}) {
  const lazyConfig = {};

  Object.entries(configMap).forEach(([key, extractor]) => {
    Object.defineProperty(lazyConfig, key, {
      get() {
        const getter = createLazyConfigGetter(`lazy-${key}`, extractor);
        return getter(params);
      },
      enumerable: true,
      configurable: true,
    });
  });

  return lazyConfig;
}

/**
 * Common configuration extractors for reuse across modules
 */
const configExtractors = {
  // Commerce configuration
  commerce: (config) => config.commerce || {},
  commerceProduct: (config) => config.commerce?.product || {},
  commerceApi: (config) => config.commerce?.api || {},

  // Storage configuration
  storage: (config) => config.storage || {},
  storageFiles: (config) => config.storage?.files || {},
  storageCsv: (config) => config.storage?.csv || {},

  // App configuration
  app: (config) => config.app || {},
  appPerformance: (config) => config.app?.performance || {},
  appMonitoring: (config) => config.app?.monitoring || {},

  // URL configuration
  url: (config) => config.url || {},
  urlRuntime: (config) => config.url?.runtime || {},

  // Testing configuration
  testing: (config) => config.testing || {},
  testingPerformance: (config) => config.testing?.performance || {},
};

/**
 * Clears the configuration cache (useful for testing)
 */
function clearConfigCache() {
  configCache.clear();
}

/**
 * Gets cache statistics for debugging
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    size: configCache.size,
    keys: Array.from(configCache.keys()),
  };
}

module.exports = {
  createLazyConfigGetter,
  createLazyConfigObject,
  configExtractors,
  clearConfigCache,
  getCacheStats,
};
