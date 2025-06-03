/**
 * API tracing utilities
 * @module core/tracing
 */
const crypto = require('crypto');

const { loadConfig } = require('../../../config');
// Load tracing configuration
const {
  app: {
    monitoring: {
      tracing: {
        enabled: TRACING_ENABLED = true,
        errorVerbosity: ERROR_VERBOSITY = 'summary',
        performance: {
          enabled: PERFORMANCE_ENABLED = true,
          includeMemory: INCLUDE_MEMORY = false,
          includeTimings: INCLUDE_TIMINGS = true,
        } = {},
      } = {},
    } = {},
  } = {},
} = loadConfig();

/**
 * Creates a new trace context for tracking API execution
 * @param {string} actionName - Name of the action being traced
 * @param {Object} params - Initial parameters
 * @returns {Object} Trace context
 */
function createTraceContext(actionName, params) {
  if (!TRACING_ENABLED) {
    return { disabled: true };
  }
  const trace = {
    id: crypto.randomUUID(),
    action: actionName,
    startTime: Date.now(),
    params: { ...params },
    errors: [],
    currentStep: null,
    metrics: [],
  };
  if (PERFORMANCE_ENABLED && INCLUDE_MEMORY) {
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
  if (PERFORMANCE_ENABLED && INCLUDE_MEMORY) {
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
    if (PERFORMANCE_ENABLED) {
      if (INCLUDE_MEMORY) {
        const endMemory = process.memoryUsage();
        metric.memory = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
        };
      }
      if (INCLUDE_TIMINGS) {
        metric.timing = {
          start: stepStart,
          end: stepEnd,
        };
      }
    }
    context.metrics.push(metric);
    return result;
  } catch (error) {
    const stepEnd = Date.now();
    const duration = stepEnd - stepStart;
    const traceError = {
      step: stepName,
      message: error.message,
      ...(ERROR_VERBOSITY === 'full' && { stack: error.stack }),
      time: stepEnd,
      duration,
    };
    if (PERFORMANCE_ENABLED && INCLUDE_MEMORY) {
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
    metrics: context.metrics,
    errors: context.errors,
    params: context.params,
  };
  if (PERFORMANCE_ENABLED && INCLUDE_MEMORY && context.startMemory) {
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
};
