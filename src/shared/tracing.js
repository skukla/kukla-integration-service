/**
 * API tracing utilities
 * @module shared/tracing
 */
const crypto = require('crypto');

const { loadConfig } = require('../../config');

/**
 * Gets tracing configuration dynamically
 * @param {Object} [params] - Action parameters for configuration loading
 * @returns {Object} Tracing configuration
 */
function getTracingConfig(params = {}) {
  const config = loadConfig(params);
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

/**
 * Creates a new trace context for tracking API execution
 * @param {string} actionName - Name of the action being traced
 * @param {Object} params - Initial parameters
 * @returns {Object} Trace context
 */
function createTraceContext(actionName, params) {
  const tracingConfig = getTracingConfig(params);

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

/**
 * Records a step in the trace context
 * @param {Object} context - Trace context
 * @param {string} stepName - Name of the step
 * @param {Function} stepFn - Function to execute
 * @returns {Promise<*>} Result of the step function
 */
async function traceStep(context, stepName, stepFn) {
  if (context.disabled) {
    return stepFn();
  }

  const stepStart = Date.now();
  context.currentStep = stepName;
  let startMemory;

  if (context.config.performance.enabled && context.config.performance.includeMemory) {
    startMemory = process.memoryUsage();
  }

  try {
    const result = await stepFn();
    const stepEnd = Date.now();
    const duration = stepEnd - stepStart;
    const metric = {
      name: stepName,
      duration,
    };

    if (context.config.performance.enabled) {
      if (context.config.performance.includeMemory) {
        const endMemory = process.memoryUsage();
        metric.memory = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
        };
      }
      if (context.config.performance.includeTimings) {
        metric.timing = {
          start: stepStart,
          end: stepEnd,
        };
      }
    }

    context.metrics.performance.push(metric);
    return result;
  } catch (error) {
    const stepEnd = Date.now();
    const duration = stepEnd - stepStart;
    const traceError = {
      step: stepName,
      message: error.message,
      ...(context.config.errorVerbosity === 'full' && { stack: error.stack }),
      time: stepEnd,
      duration,
    };

    if (context.config.performance.enabled && context.config.performance.includeMemory) {
      const endMemory = process.memoryUsage();
      traceError.memory = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
      };
    }

    context.errors.push(traceError);
    throw error;
  }
}

/**
 * Increments the API call counter in the trace context
 * @param {Object} context - Trace context
 * @param {number} [count=1] - Number of API calls to add
 */
function incrementApiCalls(context, count = 1) {
  if (context.disabled) {
    return;
  }
  context.metrics.apiCalls += count;
}

/**
 * Formats the trace context into a readable summary
 * @param {Object} context - Trace context
 * @returns {Object} Formatted trace summary
 */
function formatTrace(context) {
  if (context.disabled) {
    return null;
  }

  const endTime = Date.now();
  const duration = endTime - context.startTime;
  const summary = {
    id: context.id,
    action: context.action,
    duration,
    metrics: context.metrics.performance,
    apiCalls: context.metrics.apiCalls,
    errors: context.errors,
    params: context.params,
  };

  if (
    context.config.performance.enabled &&
    context.config.performance.includeMemory &&
    context.startMemory
  ) {
    const endMemory = process.memoryUsage();
    summary.memory = {
      heapUsed: endMemory.heapUsed - context.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - context.startMemory.heapTotal,
      external: endMemory.external - context.startMemory.external,
    };
  }

  return summary;
}

module.exports = {
  createTraceContext,
  traceStep,
  formatTrace,
  incrementApiCalls,
  getTracingConfig,
};
