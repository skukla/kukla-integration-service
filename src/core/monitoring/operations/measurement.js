/**
 * Performance Measurement Operations
 * @module core/monitoring/operations/measurement
 */

const { MetricTypes, isPerformanceEnabled, shouldSample } = require('./config');

/**
 * Starts measuring an operation
 * @param {Map} measurements - Measurements state
 * @param {string} operation - Operation name
 * @param {string} type - Metric type from MetricTypes
 * @param {Object} perfConfig - Performance configuration
 * @param {Object} options - Monitoring options
 * @returns {boolean} Whether measurement was started
 */
function startMeasurement(measurements, operation, type, perfConfig, options) {
  if (!isPerformanceEnabled(perfConfig, options) || !shouldSample(options)) {
    return false;
  }

  measurements.set(operation, {
    type: type || MetricTypes.RESPONSE_TIME,
    startTime: process.hrtime(),
    startMemory: process.memoryUsage(),
  });

  return true;
}

/**
 * Calculates memory difference between start and end
 * @param {Object} startMemory - Starting memory usage
 * @param {Object} endMemory - Ending memory usage
 * @returns {Object} Memory difference
 */
function calculateMemoryDiff(startMemory, endMemory) {
  return {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
  };
}

/**
 * Ends measuring an operation and calculates metrics
 * @param {Map} measurements - Measurements state
 * @param {Object} operationData - Operation data
 * @param {string} operationData.operation - Operation name
 * @param {Object} operationData.context - Additional context
 * @param {Object} config - Configuration and logging
 * @param {Object} config.perfConfig - Performance configuration
 * @param {Object} config.options - Monitoring options
 * @param {Object} config.logger - Logger instance
 * @returns {Object|null} Metrics results or null if monitoring disabled
 */
function endMeasurement(measurements, operationData, config) {
  const { operation, context } = operationData;
  const { perfConfig, options, logger } = config;

  if (!isPerformanceEnabled(perfConfig, options) || !measurements.has(operation)) {
    return null;
  }

  const measurement = measurements.get(operation);
  const endTime = process.hrtime(measurement.startTime);
  const endMemory = process.memoryUsage();

  const durationMs = endTime[0] * 1000 + endTime[1] / 1000000;
  const memoryDiff = calculateMemoryDiff(measurement.startMemory, endMemory);

  const results = {
    operation,
    type: measurement.type,
    duration: durationMs,
    memory: memoryDiff,
    success: context.success !== false,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Log the results if enabled
  if (logger) {
    logger.info('Performance measurement:', results);
  }

  measurements.delete(operation);
  return results;
}

/**
 * Gets current memory usage
 * @returns {Object} Memory usage stats
 */
function getMemoryUsage() {
  return process.memoryUsage();
}

module.exports = {
  startMeasurement,
  endMeasurement,
  calculateMemoryDiff,
  getMemoryUsage,
};
