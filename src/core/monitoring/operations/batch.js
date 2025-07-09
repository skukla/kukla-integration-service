/**
 * Batch Processing Operations
 * @module core/monitoring/operations/batch
 */

const { MetricTypes } = require('./config');
const { startMeasurement, endMeasurement } = require('./measurement');

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
  const defaultBatchSize = config.products?.processing?.concurrency?.monitoring || 100;
  const {
    batchSize = defaultBatchSize,
    onProgress = null,
    operationName = 'batch_processing',
  } = batchOptions;

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

module.exports = {
  processBatch,
};
