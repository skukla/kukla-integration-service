/**
 * Monitor Factory Operations
 * @module core/monitoring/operations/factory
 */

const { processBatch } = require('./batch');
const { getPerformanceConfig, createMonitoringOptions, isPerformanceEnabled } = require('./config');
const { startMeasurement, endMeasurement, getMemoryUsage } = require('./measurement');

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

module.exports = {
  createPerformanceMonitor,
};
