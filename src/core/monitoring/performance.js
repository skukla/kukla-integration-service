/**
 * Core performance monitoring utilities
 * @module core/monitoring/performance
 */

const { loadConfig } = require('../../../config');

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
 * Performance monitoring class for easier usage
 */
class PerformanceMonitor {
  constructor(logger, options = {}) {
    this.logger = logger;
    this.measurements = new Map();

    // Load configuration with proper destructuring
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
    } = loadConfig();

    this.thresholds = {
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
    };

    this.options = {
      enabled: PERFORMANCE_ENABLED,
      sampleRate: options.sampleRate || 0.1,
      ...options,
    };

    this.isEnabled = this._isPerformanceEnabled();
  }

  /**
   * Check if performance monitoring is enabled
   * @private
   */
  _isPerformanceEnabled() {
    return this.options.enabled;
  }

  /**
   * Should this operation be sampled
   * @private
   */
  _shouldSample() {
    return Math.random() < this.options.sampleRate;
  }

  /**
   * Start measuring an operation
   * @param {string} operation - Operation name
   * @param {string} type - Metric type from MetricTypes
   * @returns {void}
   */
  start(operation, type = MetricTypes.RESPONSE_TIME) {
    if (!this.isEnabled || !this._shouldSample()) return;

    this.measurements.set(operation, {
      type,
      startTime: process.hrtime(),
      startMemory: process.memoryUsage(),
    });
  }

  /**
   * End measuring an operation and calculate metrics
   * @param {string} operation - Operation name
   * @param {Object} [context] - Additional context
   * @returns {Object|null} Metrics results or null if monitoring disabled
   */
  end(operation, context = {}) {
    if (!this.isEnabled || !this.measurements.has(operation)) return null;

    const measurement = this.measurements.get(operation);
    const endTime = process.hrtime(measurement.startTime);
    const endMemory = process.memoryUsage();

    const durationMs = endTime[0] * 1000 + endTime[1] / 1000000;
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - measurement.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - measurement.startMemory.heapTotal,
      external: endMemory.external - measurement.startMemory.external,
    };

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
    if (this.logger) {
      this.logger.info('Performance measurement:', results);
    }

    this.measurements.delete(operation);
    return results;
  }

  /**
   * Get current memory usage
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage() {
    return process.memoryUsage();
  }

  /**
   * Process items in batches with performance monitoring
   * @param {Array} items - Items to process
   * @param {Function} processor - Processing function for each item
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processed results
   */
  async processBatch(items, processor, options = {}) {
    const { batchSize = 100, onProgress = null, operationName = 'batch_processing' } = options;

    this.start(operationName, MetricTypes.RESPONSE_TIME);
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

    const metrics = this.end(operationName, {
      itemCount: items.length,
      batchCount: Math.ceil(items.length / batchSize),
    });

    return {
      results,
      metrics,
    };
  }
}

// Export performance monitoring API
module.exports = {
  MetricTypes,
  PerformanceMonitor,
};
