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
  COMMERCE_API: 'commerce_api',
};

/**
 * Extracts performance configuration from config object
 * @param {Object} config - Configuration object
 * @returns {Object} Performance configuration
 */
function getPerformanceConfig(config) {
  const {
    app: {
      performance: {
        enabled: PERFORMANCE_ENABLED = true,
        thresholds: {
          api: { warning: API_WARNING_THRESHOLD, critical: API_CRITICAL_THRESHOLD },
          rendering: { warning: RENDER_WARNING_THRESHOLD, critical: RENDER_CRITICAL_THRESHOLD },
        },
      },
    },
    testing: {
      performance: {
        thresholds: {
          executionTime: EXECUTION_THRESHOLD,
          memory: MEMORY_THRESHOLD,
          responseTime: { p95: P95_THRESHOLD, p99: P99_THRESHOLD },
          errorRate: ERROR_RATE_THRESHOLD,
        },
      },
    },
  } = config;

  return {
    enabled: PERFORMANCE_ENABLED,
    thresholds: {
      api: {
        warning: API_WARNING_THRESHOLD,
        critical: API_CRITICAL_THRESHOLD,
      },
      rendering: {
        warning: RENDER_WARNING_THRESHOLD,
        critical: RENDER_CRITICAL_THRESHOLD,
      },
      execution: EXECUTION_THRESHOLD,
      memory: MEMORY_THRESHOLD,
      responseTime: {
        p95: P95_THRESHOLD,
        p99: P99_THRESHOLD,
      },
      errorRate: ERROR_RATE_THRESHOLD,
    },
  };
}

/**
 * Creates monitoring options with defaults
 * @param {Object} options - User options
 * @returns {Object} Complete options object
 */
function createMonitoringOptions(options = {}) {
  return {
    sampleRate: options.sampleRate || 0.1,
    ...options,
  };
}

/**
 * Checks if performance monitoring is enabled
 * @param {Object} perfConfig - Performance configuration
 * @param {Object} options - Monitoring options
 * @returns {boolean} Whether monitoring is enabled
 */
function isPerformanceEnabled(perfConfig, options) {
  return perfConfig.enabled && options.enabled !== false;
}

/**
 * Determines if an operation should be sampled
 * @param {Object} options - Monitoring options
 * @returns {boolean} Whether to sample this operation
 */
function shouldSample(options) {
  return Math.random() < options.sampleRate;
}

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

/**
 * Processes items in batches with performance monitoring
 * @param {Map} measurements - Measurements state
 * @param {Object} batchData - Batch processing data
 * @param {Array} batchData.items - Items to process
 * @param {Function} batchData.processor - Processing function for each item
 * @param {Object} batchData.options - Processing options
 * @param {Object} config - Configuration and logging
 * @param {Object} config.perfConfig - Performance configuration
 * @param {Object} config.options - Monitoring options
 * @param {Object} config.logger - Logger instance
 * @returns {Promise<Object>} Processed results with metrics
 */
async function processBatch(measurements, batchData, config) {
  const { items, processor, options: batchOptions } = batchData;
  const { perfConfig, options } = config;
  const { batchSize = 100, onProgress = null, operationName = 'batch_processing' } = batchOptions;

  startMeasurement(measurements, operationName, MetricTypes.RESPONSE_TIME, perfConfig, options);
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item).catch((error) => ({ error })))
    );

    results.push(...batchResults);

    if (onProgress) {
      const progress = {
        processed: i + batch.length,
        total: items.length,
        percentage: Math.round(((i + batch.length) / items.length) * 100),
      };
      onProgress(progress);
    }
  }

  const operationData = {
    operation: operationName,
    context: {
      itemCount: items.length,
      batchCount: Math.ceil(items.length / batchSize),
    },
  };

  const metrics = endMeasurement(measurements, operationData, config);

  return {
    results,
    metrics,
  };
}

/**
 * Creates a performance monitor instance using functional composition
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger instance
 * @param {Object} options - Monitoring options
 * @returns {Object} Performance monitor interface
 */
function createPerformanceMonitor(config, logger, options = {}) {
  const perfConfig = getPerformanceConfig(config);
  const monitoringOptions = createMonitoringOptions(options);
  const measurements = new Map();

  return {
    /**
     * Start measuring an operation
     * @param {string} operation - Operation name
     * @param {string} type - Metric type from MetricTypes
     * @returns {boolean} Whether measurement was started
     */
    start: (operation, type) =>
      startMeasurement(measurements, operation, type, perfConfig, monitoringOptions),

    /**
     * End measuring an operation and calculate metrics
     * @param {string} operation - Operation name
     * @param {Object} context - Additional context
     * @returns {Object|null} Metrics results or null if monitoring disabled
     */
    end: (operation, context = {}) => {
      const operationData = { operation, context };
      const config = { perfConfig, options: monitoringOptions, logger };
      return endMeasurement(measurements, operationData, config);
    },

    /**
     * Get current memory usage
     * @returns {Object} Memory usage stats
     */
    getMemoryUsage,

    /**
     * Process items in batches with performance monitoring
     * @param {Array} items - Items to process
     * @param {Function} processor - Processing function for each item
     * @param {Object} batchOptions - Processing options
     * @returns {Promise<Object>} Processed results with metrics
     */
    processBatch: (items, processor, batchOptions = {}) => {
      const batchData = { items, processor, options: batchOptions };
      const config = { perfConfig, options: monitoringOptions, logger };
      return processBatch(measurements, batchData, config);
    },

    /**
     * Check if performance monitoring is enabled
     * @returns {boolean} Whether monitoring is enabled
     */
    isEnabled: () => isPerformanceEnabled(perfConfig, monitoringOptions),

    /**
     * Get performance configuration
     * @returns {Object} Performance configuration
     */
    getConfig: () => ({ ...perfConfig }),

    /**
     * Get monitoring options
     * @returns {Object} Monitoring options
     */
    getOptions: () => ({ ...monitoringOptions }),
  };
}

// Export performance monitoring API using functional composition
module.exports = {
  MetricTypes,
  createPerformanceMonitor,
  getPerformanceConfig,
  isPerformanceEnabled,
  shouldSample,
  getMemoryUsage,
};
