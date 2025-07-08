/**
 * Tracing Format Operations
 * @module core/tracing/operations/format
 */

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
  formatTrace,
};
