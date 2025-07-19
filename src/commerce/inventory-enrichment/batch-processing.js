/**
 * Inventory Enrichment - Batch Processing Sub-module
 * All inventory data fetching and batch processing utilities
 */

const { executeAuthenticatedCommerceRequest } = require('../admin-token-auth');

// Batch Processing Workflows

/**
 * Intelligent inventory data fetching with advanced batching and concurrency control
 * @purpose Coordinate inventory data fetching with configurable batching, concurrency limits, and error recovery
 * @param {Array} skus - Array of unique SKUs to fetch from Commerce API
 * @param {Object} config - Configuration object with batching and performance settings
 * @param {Object} params - Action parameters containing admin credentials for API requests
 * @param {Object} [trace=null] - Optional trace context for performance monitoring
 * @param {Object} [options={}] - Fetching options including retry strategies and error handling
 * @returns {Promise<Object>} Map of SKU to complete inventory data with stock metadata
 * @throws {Error} When critical API failures occur or authentication errors prevent access
 * @usedBy enrichProductsWithInventoryAndValidation
 */
async function fetchInventoryDataWithBatching(skus, config, params, trace = null, options = {}) {
  const inventoryMap = {};

  if (!skus || skus.length === 0) {
    return inventoryMap;
  }

  const batchSize = config.commerce.batching.inventory;
  const requestDelay = config.performance.batching.requestDelay;
  const maxConcurrent = config.performance.batching.maxConcurrent;

  // Process in batches with configurable concurrency
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const inventoryPromises = chunk.map(async (sku) => {
        return await fetchSingleInventoryWithRetry(sku, config, params, trace, options);
      });

      const chunkResults = await Promise.allSettled(inventoryPromises);

      // Process settled promises and collect results
      chunkResults.forEach((result, index) => {
        const sku = chunk[index];
        if (result.status === 'fulfilled' && result.value) {
          inventoryMap[sku] = result.value;
        } else {
          console.warn(
            `Failed to fetch inventory for ${sku}: ${result.reason ? result.reason.message : 'Unknown error'}`
          );
          inventoryMap[sku] = createFallbackInventoryData(sku, options);
        }
      });

      // Add configurable delay between chunks to prevent rate limiting
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return inventoryMap;
}

// Batch Processing Utilities

/**
 * Fetch single inventory item with intelligent retry logic
 * @purpose Retrieve individual inventory data with configurable retry strategies and error handling
 * @param {string} sku - Product SKU to fetch inventory for
 * @param {Object} config - Configuration object with API settings
 * @param {Object} params - Action parameters with credentials
 * @param {Object} [trace=null] - Optional trace context
 * @param {Object} [options={}] - Retry and error handling options
 * @returns {Promise<Object|null>} Inventory data or null if fetch fails
 * @usedBy fetchInventoryDataWithBatching
 */
async function fetchSingleInventoryWithRetry(sku, config, params, trace = null, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const inventoryUrl = `${config.commerce.baseUrl}/rest/V1/stockItems/${sku}`;

      if (trace && trace.incrementApiCalls) {
        trace.incrementApiCalls();
      }

      const response = await executeAuthenticatedCommerceRequest(
        inventoryUrl,
        { method: 'GET' },
        config,
        params,
        trace
      );

      if (response && (response.item_id || response.qty !== undefined)) {
        return response;
      }

      throw new Error(`Invalid inventory response for SKU ${sku}`);
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(
          `Failed to fetch inventory for ${sku} after ${maxRetries} attempts:`,
          error.message
        );
        return null;
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return null;
}

/**
 * Create fallback inventory data
 * @purpose Generate fallback inventory object when API fetch fails
 * @param {string} sku - Product SKU for fallback data
 * @param {Object} [options={}] - Fallback generation options
 * @returns {Object} Fallback inventory data object
 * @usedBy fetchInventoryDataWithBatching
 */
function createFallbackInventoryData(sku, options = {}) {
  return {
    item_id: 0,
    product_id: 0,
    stock_id: 1,
    qty: 0,
    is_in_stock: false,
    is_qty_decimal: false,
    show_default_notification_message: false,
    use_config_min_qty: true,
    min_qty: 0,
    use_config_min_sale_qty: true,
    min_sale_qty: 1,
    use_config_max_sale_qty: true,
    max_sale_qty: 10000,
    use_config_backorders: true,
    backorders: 0,
    use_config_notify_stock_qty: true,
    notify_stock_qty: 1,
    use_config_qty_increments: true,
    qty_increments: 0,
    use_config_enable_qty_inc: true,
    enable_qty_increments: false,
    use_config_manage_stock: true,
    manage_stock: true,
    low_stock_date: null,
    is_decimal_divided: false,
    stock_status_changed_auto: 0,
    sku: sku,
    isFallback: true,
    fallbackReason: options.fallbackReason || 'API fetch failed',
  };
}

module.exports = {
  // Workflows (used by feature core)
  fetchInventoryDataWithBatching,

  // Utilities (available for testing/extension)
  fetchSingleInventoryWithRetry,
  createFallbackInventoryData,
};
