/**
 * Default configuration for API testing
 */

const { loadConfig } = require('../../../config');

/**
 * Get default configuration using lazy loading
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Default configuration
 */
function getDefaultConfig(params = {}) {
  const config = loadConfig(params);
  return {
    // Default API test settings
    api: {
      endpoint: config.testing.api.defaults.endpoint,
      method: config.testing.api.defaults.method,
      fields: config.testing.api.defaults.fields,
      timeout: config.testing.api.timeout,
      retry: {
        attempts: config.testing.api.retry.attempts,
        delay: config.testing.api.retry.delay,
      },
      logLevel: config.testing.api.logLevel,
    },

    // Default performance settings
    performance: {
      thresholds: {
        executionTime: config.testing.performance.thresholds.executionTime,
        memory: config.testing.performance.thresholds.memory,
        responseTime: {
          p95: config.testing.performance.thresholds.responseTime.p95,
          p99: config.testing.performance.thresholds.responseTime.p99,
        },
        errorRate: config.testing.performance.thresholds.errorRate,
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
