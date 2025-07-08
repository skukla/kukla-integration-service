/**
 * Core performance monitoring utilities
 * @module core/monitoring/performance
 *
 * Functionally composed performance monitoring system using operation modules:
 * - config: Performance configuration and enablement logic
 * - measurement: Timing and memory measurement operations
 * - batch: Batch processing with performance tracking
 * - factory: Performance monitor instance creation
 */

// Import operation modules
const {
  MetricTypes,
  getPerformanceConfig,
  isPerformanceEnabled,
  shouldSample,
} = require('./operations/config');
const { createPerformanceMonitor } = require('./operations/factory');
const { getMemoryUsage } = require('./operations/measurement');

// Export performance monitoring API using functional composition
module.exports = {
  MetricTypes,
  createPerformanceMonitor,
  getPerformanceConfig,
  isPerformanceEnabled,
  shouldSample,
  getMemoryUsage,
};
