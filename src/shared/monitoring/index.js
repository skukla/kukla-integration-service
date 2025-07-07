/**
 * Core monitoring module
 * @module core/monitoring
 */

const { ErrorMonitor } = require('./errors');
const { PerformanceMonitor, MetricTypes } = require('./performance');

/**
 * Create monitoring middleware
 * @param {Object} options Monitoring options
 * @returns {Function} Monitoring middleware
 */
function createMonitoringMiddleware(options = {}) {
  const perfMonitor = new PerformanceMonitor(options.logger, options.performance);
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
  PerformanceMonitor,
  ErrorMonitor,
  MetricTypes,
  createMonitoringMiddleware,
};
