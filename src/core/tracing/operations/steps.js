/**
 * Tracing Steps Operations
 * @module core/tracing/operations/steps
 */

const { createStepMetric, createStepError } = require('./metrics');

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
  const startMemory =
    context.config.performance.enabled && context.config.performance.includeMemory
      ? process.memoryUsage()
      : null;

  try {
    const result = await stepFn();
    const stepEnd = Date.now();

    const metric = createStepMetric(stepName, context, stepStart, stepEnd, startMemory);
    context.metrics.performance.push(metric);

    return result;
  } catch (error) {
    const stepEnd = Date.now();

    const traceError = createStepError(
      stepName,
      error,
      { stepStart, stepEnd },
      context,
      startMemory
    );
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

module.exports = {
  traceStep,
  incrementApiCalls,
};
