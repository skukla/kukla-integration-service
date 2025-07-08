/**
 * API tracing utilities
 * @module core/tracing
 *
 * Functionally composed tracing system using operation modules:
 * - config: Tracing configuration extraction and processing
 * - context: Trace context creation and initialization
 * - metrics: Memory calculations and metric creation
 * - steps: Step execution and API call tracking
 * - format: Trace summary formatting
 */

// Import operation modules
const { getTracingConfig } = require('./operations/config');
const { createTraceContext } = require('./operations/context');
const { formatTrace } = require('./operations/format');
const { traceStep, incrementApiCalls } = require('./operations/steps');

// Export tracing API using functional composition
module.exports = {
  createTraceContext,
  traceStep,
  formatTrace,
  incrementApiCalls,
  getTracingConfig,
};
