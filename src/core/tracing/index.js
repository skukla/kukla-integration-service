/**
 * API tracing utilities
 * @module core/tracing
 */

const crypto = require('crypto');

/**
 * Creates a new trace context for tracking API execution
 * @param {string} actionName - Name of the action being traced
 * @param {Object} params - Initial parameters
 * @returns {Object} Trace context
 */
function createTraceContext(actionName, params) {
  const trace = {
    id: crypto.randomUUID(),
    actionName,
    startTime: Date.now(),
    steps: [],
    params: { ...params },
    errors: [],
    currentStep: null,
  };

  console.log(`\n🚀 Starting action: ${actionName}`);
  console.log(`📝 Trace ID: ${trace.id}`);
  if (Object.keys(params).length) {
    console.log('📋 Parameters:', params);
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
  const stepStart = Date.now();
  context.currentStep = stepName;

  try {
    console.log(`\n🔄 [${stepName}] Starting...`);
    const result = await stepFn();
    const stepEnd = Date.now();
    const duration = stepEnd - stepStart;

    context.steps.push({
      name: stepName,
      status: 'success',
      duration,
    });

    console.log(`✅ [${stepName}] Completed in ${duration}ms`);
    return result;
  } catch (error) {
    const stepEnd = Date.now();
    const duration = stepEnd - stepStart;

    const traceError = {
      step: stepName,
      message: error.message,
      stack: error.stack,
      time: stepEnd,
      duration,
    };

    context.steps.push({
      name: stepName,
      status: 'error',
      error: traceError,
      duration,
    });

    context.errors.push(traceError);

    console.error(`\n❌ [${stepName}] Failed after ${duration}ms`);
    console.error(`🔍 Error: ${error.message}`);
    if (error.stack) {
      console.error('📚 Stack trace:', error.stack);
    }

    throw error;
  }
}

/**
 * Formats the trace context into a readable summary
 * @param {Object} context - Trace context
 * @returns {Object} Formatted trace summary
 */
function formatTrace(context) {
  const endTime = Date.now();
  const duration = endTime - context.startTime;

  const summary = {
    id: context.id,
    action: context.actionName,
    duration,
    steps: context.steps.map((step) => ({
      name: step.name,
      status: step.status,
      duration: step.duration,
      ...(step.error && { error: step.error }),
    })),
    errors: context.errors,
    params: context.params,
  };

  console.log('\n📊 Action Summary:');
  console.log(`🎯 Action: ${context.actionName}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log('📝 Steps:');
  summary.steps.forEach((step) => {
    const icon = step.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${step.name} (${step.duration}ms)`);
  });

  if (summary.errors.length) {
    console.log('\n❌ Errors encountered:', summary.errors.length);
  }

  return summary;
}

module.exports = {
  createTraceContext,
  traceStep,
  formatTrace,
};
