/**
 * Default configuration for API testing
 */

const { loadConfig } = require('../../../config');

// Load configuration with proper destructuring
const {
  testing: {
    api: {
      defaults: { fields: DEFAULT_FIELDS, endpoint: DEFAULT_ENDPOINT, method: DEFAULT_METHOD },
      timeout: API_TIMEOUT,
      retry: { attempts: RETRY_ATTEMPTS, delay: RETRY_DELAY },
      logLevel: LOG_LEVEL,
    },
    performance: {
      thresholds: {
        executionTime: EXECUTION_THRESHOLD,
        memory: MEMORY_THRESHOLD,
        responseTime: { p95: P95_THRESHOLD, p99: P99_THRESHOLD },
        errorRate: ERROR_RATE_THRESHOLD,
      },
    },
  },
} = loadConfig();

const defaultConfig = {
  // Default API test settings
  api: {
    endpoint: DEFAULT_ENDPOINT,
    method: DEFAULT_METHOD,
    fields: DEFAULT_FIELDS,
    timeout: API_TIMEOUT,
    retry: {
      attempts: RETRY_ATTEMPTS,
      delay: RETRY_DELAY,
    },
    logLevel: LOG_LEVEL,
  },

  // Default performance settings
  performance: {
    thresholds: {
      executionTime: EXECUTION_THRESHOLD,
      memory: MEMORY_THRESHOLD,
      responseTime: {
        p95: P95_THRESHOLD,
        p99: P99_THRESHOLD,
      },
      errorRate: ERROR_RATE_THRESHOLD,
    },
  },

  // Validation settings
  validation: {
    warnOnEmptyArrays: true,
    requireSuccessField: true,
  },
};

/**
 * Get configuration with optional overrides
 * @param {Object} overrides - Override default config values
 * @returns {Object} Final configuration
 */
function getConfig(overrides = {}) {
  return {
    ...defaultConfig,
    ...overrides,
    api: {
      ...defaultConfig.api,
      ...overrides.api,
      retry: {
        ...defaultConfig.api.retry,
        ...overrides.api?.retry,
      },
    },
    performance: {
      ...defaultConfig.performance,
      ...overrides.performance,
      thresholds: {
        ...defaultConfig.performance.thresholds,
        ...overrides.performance?.thresholds,
        responseTime: {
          ...defaultConfig.performance.thresholds.responseTime,
          ...overrides.performance?.thresholds?.responseTime,
        },
      },
    },
    validation: {
      ...defaultConfig.validation,
      ...overrides.validation,
    },
  };
}

module.exports = {
  defaultConfig,
  getConfig,
};
