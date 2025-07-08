/**
 * Tracing Metrics Operations
 * @module core/tracing/operations/metrics
 */

/**
 * Calculates memory usage difference between start and end
 * @param {Object} startMemory - Starting memory usage
 * @param {Object} endMemory - Ending memory usage
 * @returns {Object} Memory usage difference
 */
function calculateMemoryDiff(startMemory, endMemory) {
  return {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
  };
}

/**
 * Creates success metric for trace step
 * @param {string} stepName - Name of the step
 * @param {Object} context - Trace context
 * @param {number} stepStart - Step start time
 * @param {number} stepEnd - Step end time
 * @param {Object} [startMemory] - Starting memory usage
 * @returns {Object} Performance metric
 */
function createStepMetric(stepName, context, stepStart, stepEnd, startMemory) {
  const metric = {
    name: stepName,
    duration: stepEnd - stepStart,
  };

  if (context.config.performance.enabled) {
    if (context.config.performance.includeMemory && startMemory) {
      metric.memory = calculateMemoryDiff(startMemory, process.memoryUsage());
    }
    if (context.config.performance.includeTimings) {
      metric.timing = {
        start: stepStart,
        end: stepEnd,
      };
    }
  }

  return metric;
}

/**
 * Creates error trace for failed step
 * @param {string} stepName - Name of the step
 * @param {Error} error - Error that occurred
 * @param {Object} timing - Timing object with stepStart and stepEnd
 * @param {Object} context - Trace context
 * @param {Object} [startMemory] - Starting memory usage
 * @returns {Object} Error trace
 */
function createStepError(stepName, error, timing, context, startMemory) {
  const traceError = {
    step: stepName,
    message: error.message,
    ...(context.config.errorVerbosity === 'full' && { stack: error.stack }),
    time: timing.stepEnd,
    duration: timing.stepEnd - timing.stepStart,
  };

  if (
    context.config.performance.enabled &&
    context.config.performance.includeMemory &&
    startMemory
  ) {
    traceError.memory = calculateMemoryDiff(startMemory, process.memoryUsage());
  }

  return traceError;
}

module.exports = {
  calculateMemoryDiff,
  createStepMetric,
  createStepError,
};
