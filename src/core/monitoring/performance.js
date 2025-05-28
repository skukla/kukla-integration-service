/**
 * Core performance monitoring utilities
 * @module core/monitoring/performance
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
 * End measuring an operation and calculate metrics
 * @param {Object} state - Performance metrics state
 * @param {string} operation - Operation name
 * @param {Object} [context] - Additional context
 * @returns {Object} Metrics results
 */
function endMeasurement(state, operation, context = {}) {
  const measurement = state.measurements.get(operation);
  if (!measurement) {
    return { results: null };
  }

  const endTime = process.hrtime(measurement.startTime);
  const endMemory = process.memoryUsage();
  
  const durationMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
  const memoryDiff = {
    heapUsed: endMemory.heapUsed - measurement.startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - measurement.startMemory.heapTotal,
    external: endMemory.external - measurement.startMemory.external
  };

  const results = {
    operation,
    type: measurement.type,
    duration: durationMs,
    memory: memoryDiff,
    success: context.success !== false,
    timestamp: new Date().toISOString(),
    ...context
  };

  // Log the results
  state.logger.info('Performance measurement:', results);

  return { results };
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
      const metrics = endMeasurement(metricsState, operation, { success: true });
      
      // Add performance metrics to response if appropriate
      if (result && typeof result === 'object') {
        return {
          ...result,
          performance: metrics
        };
      }
      
      return result;
    } catch (error) {
      endMeasurement(metricsState, operation, { 
        success: false, 
        error: error.message 
      });
      throw error;
    }
  };
}

/**
 * Performance monitoring class for easier usage
 */
class PerformanceMonitor {
  constructor(logger) {
    this.state = createMetricsState(logger);
  }

  start(operation, type) {
    this.state = startMeasurement(this.state, operation, type);
  }

  end(operation, context) {
    const { results } = endMeasurement(this.state, operation, context);
    return results;
  }

  getMemoryUsage() {
    return process.memoryUsage();
  }
}

/**
 * Track memory usage during batch processing
 * @param {Array} items - Items to process
 * @param {Function} processItem - Function to process a single item
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed items
 */
async function trackMemory(items, processItem, options = {}) {
    const { 
        batchSize = 100,
        gcThreshold = 50 * 1024 * 1024, // 50MB
        onProgress = () => {}
    } = options;

    const processedItems = [];
    let currentBatch = [];

    for (let i = 0; i < items.length; i++) {
        currentBatch.push(items[i]);

        if (currentBatch.length >= batchSize || i === items.length - 1) {
            // Process current batch
            const batchResults = await Promise.all(
                currentBatch.map(item => processItem(item))
            );
            processedItems.push(...batchResults);

            // Clear the batch
            currentBatch = [];

            // Report progress
            await onProgress({
                processed: processedItems.length,
                total: items.length,
                memory: process.memoryUsage().heapUsed
            });

            // Run garbage collection if memory usage is high
            if (process.memoryUsage().heapUsed > gcThreshold) {
                global.gc && global.gc();
            }
        }
    }

    return processedItems;
}

module.exports = {
  MetricTypes,
  createMetricsState,
  startMeasurement,
  endMeasurement,
  createPerformanceMiddleware,
  PerformanceMonitor,
  trackMemory
}; 