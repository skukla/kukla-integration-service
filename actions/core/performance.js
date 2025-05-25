/**
 * Core performance monitoring utilities
 * @module actions/core/performance
 */

/**
 * Performance metric types
 * @enum {string}
 */
const MetricTypes = {
  RESPONSE_TIME: 'response_time',
  MEMORY_USAGE: 'memory_usage',
  FILE_OPERATION: 'file_operation',
  COMMERCE_API: 'commerce_api'
};

/**
 * Simple performance measurement class
 */
class PerformanceMetrics {
  constructor(logger) {
    this.logger = logger;
    this.measurements = new Map();
  }

  /**
   * Start measuring an operation
   * @param {string} operation - Operation name
   * @param {string} type - Metric type from MetricTypes
   */
  start(operation, type = MetricTypes.RESPONSE_TIME) {
    this.measurements.set(operation, {
      type,
      startTime: process.hrtime(),
      startMemory: process.memoryUsage()
    });
  }

  /**
   * End measuring an operation and log results
   * @param {string} operation - Operation name
   * @param {Object} [context] - Additional context
   */
  end(operation, context = {}) {
    const measurement = this.measurements.get(operation);
    if (!measurement) {
      return;
    }

    const { type, startTime, startMemory } = measurement;
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    const endMemory = process.memoryUsage();
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    this.measurements.delete(operation);
  }

  /**
   * Get current memory usage
   * @returns {Object} Memory usage stats in MB
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }
}

/**
 * Creates performance monitoring middleware for actions
 * @param {Object} logger - Logger instance
 * @returns {Function} Middleware function
 */
function createPerformanceMiddleware(logger) {
  return async (params, action) => {
    const metrics = new PerformanceMetrics(logger);
    const operation = action.name || 'unknown_action';

    try {
      metrics.start(operation);
      const result = await action(params);
      metrics.end(operation, { success: true });
      return result;
    } catch (error) {
      metrics.end(operation, { success: false, error: error.message });
      throw error;
    }
  };
}

module.exports = {
  MetricTypes,
  PerformanceMetrics,
  createPerformanceMiddleware
}; 