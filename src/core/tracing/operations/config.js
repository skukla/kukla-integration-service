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
  const performanceConfig = tracingConfig.performance;

  return {
    enabled: tracingConfig.enabled,
    errorVerbosity: tracingConfig.errorVerbosity,
    performance: {
      enabled: performanceConfig.enabled,
      includeMemory: performanceConfig.includeMemory,
      includeTimings: performanceConfig.includeTimings,
    },
  };
}

module.exports = {
  getTracingConfig,
};
