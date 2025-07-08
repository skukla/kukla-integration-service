/**
 * Performance Configuration Operations
 * @module core/monitoring/operations/config
 */

/**
 * Performance metric types
 * @enum {string}
 */
const MetricTypes = {
  RESPONSE_TIME: 'response_time',
  MEMORY_USAGE: 'memory_usage',
  FILE_OPERATION: 'file_operation',
  COMMERCE_API: 'commerce_api',
};

/**
 * Extracts performance configuration from config object
 * @param {Object} config - Configuration object
 * @returns {Object} Performance configuration
 */
function getPerformanceConfig(config) {
  const {
    app: {
      performance: {
        enabled: PERFORMANCE_ENABLED = true,
        thresholds: {
          api: { warning: API_WARNING_THRESHOLD, critical: API_CRITICAL_THRESHOLD },
          rendering: { warning: RENDER_WARNING_THRESHOLD, critical: RENDER_CRITICAL_THRESHOLD },
        },
      },
    },
    testing: {
      performance: {
        thresholds: {
          executionTime: EXECUTION_THRESHOLD,
          memory: MEMORY_THRESHOLD,
          responseTime: { p95: P95_THRESHOLD, p99: P99_THRESHOLD },
          errorRate: ERROR_RATE_THRESHOLD,
        },
      },
    },
  } = config;

  return {
    enabled: PERFORMANCE_ENABLED,
    thresholds: {
      api: {
        warning: API_WARNING_THRESHOLD,
        critical: API_CRITICAL_THRESHOLD,
      },
      rendering: {
        warning: RENDER_WARNING_THRESHOLD,
        critical: RENDER_CRITICAL_THRESHOLD,
      },
      execution: EXECUTION_THRESHOLD,
      memory: MEMORY_THRESHOLD,
      responseTime: {
        p95: P95_THRESHOLD,
        p99: P99_THRESHOLD,
      },
      errorRate: ERROR_RATE_THRESHOLD,
    },
  };
}

/**
 * Creates monitoring options with defaults
 * @param {Object} options - User options
 * @returns {Object} Complete options object
 */
function createMonitoringOptions(options = {}) {
  return {
    sampleRate: options.sampleRate || 0.1,
    ...options,
  };
}

/**
 * Checks if performance monitoring is enabled
 * @param {Object} perfConfig - Performance configuration
 * @param {Object} options - Monitoring options
 * @returns {boolean} Whether monitoring is enabled
 */
function isPerformanceEnabled(perfConfig, options) {
  return perfConfig.enabled && options.enabled !== false;
}

/**
 * Determines if an operation should be sampled
 * @param {Object} options - Monitoring options
 * @returns {boolean} Whether to sample this operation
 */
function shouldSample(options) {
  return Math.random() < options.sampleRate;
}

module.exports = {
  MetricTypes,
  getPerformanceConfig,
  createMonitoringOptions,
  isPerformanceEnabled,
  shouldSample,
};
