/**
 * Default configuration for API testing
 */

const { createLazyConfigGetter } = require('../config/lazy-loader');

/**
 * Lazy configuration getter for testing
 * @type {Function}
 */
const getTestingConfig = createLazyConfigGetter('testing-config', (config) => ({
  api: {
    defaults: {
      fields: config.testing?.api?.defaults?.fields || ['sku', 'name', 'price'],
      endpoint: config.testing?.api?.defaults?.endpoint || '/rest/V1/products',
      method: config.testing?.api?.defaults?.method || 'GET',
    },
    timeout: config.testing?.api?.timeout || 30000,
    retry: {
      attempts: config.testing?.api?.retry?.attempts || 3,
      delay: config.testing?.api?.retry?.delay || 1000,
    },
    logLevel: config.testing?.api?.logLevel || 'info',
  },
  performance: {
    thresholds: {
      executionTime: config.testing?.performance?.thresholds?.executionTime || 5000,
      memory: config.testing?.performance?.thresholds?.memory || 100,
      responseTime: {
        p95: config.testing?.performance?.thresholds?.responseTime?.p95 || 2000,
        p99: config.testing?.performance?.thresholds?.responseTime?.p99 || 5000,
      },
      errorRate: config.testing?.performance?.thresholds?.errorRate || 0.05,
    },
  },
}));

/**
 * Get default configuration using lazy loading
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Default configuration
 */
function getDefaultConfig(params = {}) {
  const config = getTestingConfig(params);
  return {
    // Default API test settings
    api: {
      endpoint: config.api.defaults.endpoint,
      method: config.api.defaults.method,
      fields: config.api.defaults.fields,
      timeout: config.api.timeout,
      retry: {
        attempts: config.api.retry.attempts,
        delay: config.api.retry.delay,
      },
      logLevel: config.api.logLevel,
    },

    // Default performance settings
    performance: {
      thresholds: {
        executionTime: config.performance.thresholds.executionTime,
        memory: config.performance.thresholds.memory,
        responseTime: {
          p95: config.performance.thresholds.responseTime.p95,
          p99: config.performance.thresholds.responseTime.p99,
        },
        errorRate: config.performance.thresholds.errorRate,
      },
    },

    // Validation settings
    validation: {
      warnOnEmptyArrays: true,
      requireSuccessField: true,
    },
  };
}

/**
 * Get configuration with optional overrides
 * @param {Object} overrides - Override default config values
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Final configuration
 */
function getConfig(overrides = {}, params = {}) {
  const dynamicDefaultConfig = getDefaultConfig(params);
  return {
    ...dynamicDefaultConfig,
    ...overrides,
    api: {
      ...dynamicDefaultConfig.api,
      ...overrides.api,
      retry: {
        ...dynamicDefaultConfig.api.retry,
        ...overrides.api?.retry,
      },
    },
    performance: {
      ...dynamicDefaultConfig.performance,
      ...overrides.performance,
      thresholds: {
        ...dynamicDefaultConfig.performance.thresholds,
        ...overrides.performance?.thresholds,
        responseTime: {
          ...dynamicDefaultConfig.performance.thresholds.responseTime,
          ...overrides.performance?.thresholds?.responseTime,
        },
      },
    },
    validation: {
      ...dynamicDefaultConfig.validation,
      ...overrides.validation,
    },
  };
}

module.exports = {
  getDefaultConfig,
  getConfig,
};
