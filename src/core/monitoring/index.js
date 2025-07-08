/**
 * Core monitoring module
 * @module core/monitoring
 */

const { ErrorMonitor } = require('./errors');
const { createPerformanceMonitor, MetricTypes } = require('./performance');

/**
 * Create monitoring middleware
 * @param {Object} config Configuration object
 * @param {Object} options Monitoring options
 * @returns {Function} Monitoring middleware
 */
function createMonitoringMiddleware(config, options = {}) {
  const perfMonitor = createPerformanceMonitor(config, options.logger, options.performance);
  const errorMonitor = new ErrorMonitor(options.logger, options.errors);

  return async function monitor(req, res, next) {
    const operationId = `${req.method} ${req.path}`;
    perfMonitor.start(operationId);

    try {
      await next();
      perfMonitor.end(operationId, { success: true });
    } catch (error) {
      errorMonitor.captureError(error, { req });
      perfMonitor.end(operationId, { success: false, error: error.message });
      throw error;
    }
  };
}

module.exports = {
  createPerformanceMonitor,
  ErrorMonitor,
  MetricTypes,
  createMonitoringMiddleware,
  // Legacy export for backward compatibility
  PerformanceMonitor: createPerformanceMonitor,
};
