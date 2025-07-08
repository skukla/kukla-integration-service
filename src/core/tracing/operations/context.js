/**
 * Tracing Context Operations
 * @module core/tracing/operations/context
 */

const crypto = require('crypto');

const { getTracingConfig } = require('./config');

/**
 * Creates a new trace context for tracking API execution
 * @param {string} actionName - Name of the action being traced
 * @param {Object} config - Configuration object
 * @param {Object} params - Initial parameters
 * @returns {Object} Trace context
 */
function createTraceContext(actionName, config, params) {
  const tracingConfig = getTracingConfig(config);

  if (!tracingConfig.enabled) {
    return { disabled: true };
  }

  const trace = {
    id: crypto.randomUUID(),
    action: actionName,
    startTime: Date.now(),
    params: { ...params },
    errors: [],
    currentStep: null,
    metrics: {
      apiCalls: 0,
      performance: [],
    },
    config: tracingConfig, // Store config for later use
  };

  if (tracingConfig.performance.enabled && tracingConfig.performance.includeMemory) {
    trace.startMemory = process.memoryUsage();
  }

  return trace;
}

module.exports = {
  createTraceContext,
};
