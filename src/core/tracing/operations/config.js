/**
 * Tracing Configuration Operations
 * @module core/tracing/operations/config
 */

/**
 * Gets tracing configuration from provided config object
 * @param {Object} config - Configuration object
 * @returns {Object} Tracing configuration
 */
function getTracingConfig(config) {
  const tracingConfig = config.performance.tracing;
  const performanceConfig = tracingConfig.performance || {};

  return {
    enabled: tracingConfig.enabled !== false,
    errorVerbosity: tracingConfig.errorVerbosity || 'summary',
    performance: {
      enabled: performanceConfig.enabled !== false,
      includeMemory: performanceConfig.includeMemory || false,
      includeTimings: performanceConfig.includeTimings !== false,
    },
  };
}

module.exports = {
  getTracingConfig,
};
