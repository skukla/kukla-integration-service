/**
 * Core performance monitoring utilities
 * Pure functions for performance measurement and tracking
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
 * Creates a new performance metrics state
 * @param {Object} logger - Logger instance
 * @returns {Object} Performance metrics state
 */
function createMetricsState(logger) {
  return {
    logger,
    measurements: new Map()
  };
}

/**
 * Start measuring an operation
 * @param {Object} state - Performance metrics state
 * @param {string} operation - Operation name
 * @param {string} type - Metric type from MetricTypes
 * @returns {Object} Updated state
 */
function startMeasurement(state, operation, type = MetricTypes.RESPONSE_TIME) {
  const newMeasurements = new Map(state.measurements);
  newMeasurements.set(operation, {
    type,
    startTime: process.hrtime(),
    startMemory: process.memoryUsage()
  });

  return {
    ...state,
    measurements: newMeasurements
  };
}

/**
 * Calculate duration from start time
 * @param {[number, number]} startTime - Start time from process.hrtime()
 * @returns {number} Duration in milliseconds
 */
function calculateDuration(startTime) {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  return seconds * 1000 + nanoseconds / 1000000;
}

/**
 * Calculate memory difference between two memory snapshots
 * @param {Object} endMemory - End memory usage
 * @param {Object} startMemory - Start memory usage
 * @returns {Object} Memory difference
 */
function calculateMemoryDiff(endMemory, startMemory) {
  return {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external
  };
}

/**
 * Convert memory values to megabytes
 * @param {Object} memoryStats - Memory statistics object
 * @returns {Object} Memory stats in MB
 */
function convertToMegabytes(memoryStats) {
  return Object.entries(memoryStats).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: Math.round(value / 1024 / 1024)
  }), {});
}

/**
 * End measuring an operation and get results
 * @param {Object} state - Performance metrics state
 * @param {string} operation - Operation name
 * @param {Object} [context] - Additional context
 * @returns {Object} Updated state and measurement results
 */
function endMeasurement(state, operation, context = {}) {
  const measurement = state.measurements.get(operation);
  if (!measurement) {
    return { state, results: null };
  }

  const { type, startTime, startMemory } = measurement;
  const duration = calculateDuration(startTime);
  const memoryDiff = calculateMemoryDiff(process.memoryUsage(), startMemory);

  const results = {
    operation,
    type,
    duration,
    memoryDiff: convertToMegabytes(memoryDiff),
    context
  };

  const newMeasurements = new Map(state.measurements);
  newMeasurements.delete(operation);

  return {
    state: {
      ...state,
      measurements: newMeasurements
    },
    results
  };
}

/**
 * Get current memory usage in MB
 * @returns {Object} Memory usage stats in MB
 */
function getCurrentMemoryUsage() {
  return convertToMegabytes(process.memoryUsage());
}

/**
 * Creates performance monitoring middleware for actions
 * @param {Object} logger - Logger instance
 * @returns {Function} Middleware function
 */
function createPerformanceMiddleware(logger) {
  return async (params, action) => {
    let metricsState = createMetricsState(logger);
    const operation = action.name || 'unknown_action';

    try {
      metricsState = startMeasurement(metricsState, operation);
      const result = await action(params);
      const { results } = endMeasurement(metricsState, operation, { success: true });
      return result;
    } catch (error) {
      const { results } = endMeasurement(metricsState, operation, { 
        success: false, 
        error: error.message 
      });
      throw error;
    }
  };
}

module.exports = {
  MetricTypes,
  createMetricsState,
  startMeasurement,
  endMeasurement,
  getCurrentMemoryUsage,
  createPerformanceMiddleware
}; 