/**
 * Adobe Commerce Inventory Module
 * Handles inventory data operations following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Build Commerce API search criteria URL parameters
 * @param {string} field - Search field name
 * @param {string} value - Search value
 * @param {string} condition - Search condition (default: 'eq')
 * @returns {string} URL search parameters
 */
function buildSearchCriteria(field, value, condition = 'eq') {
  return `searchCriteria[filter_groups][0][filters][0][field]=${field}&searchCriteria[filter_groups][0][filters][0][value]=${value}&searchCriteria[filter_groups][0][filters][0][condition_type]=${condition}`;
}

/**
 * Fetch inventory for a batch of products
 * @param {Array} products - Product batch
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Array>} Inventory data
 */
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-inventory');

  const inventoryPromises = products.map(async (product) => {
    const url = `${baseUrl}/rest/${api.version}/inventory/source-items?${buildSearchCriteria('sku', product.sku)}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      if (!response.ok) {
        log.warn('Inventory fetch failed', { sku: product.sku, status: response.status });
        return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
      }

      const result = await response.json();
      const sourceItems = result.items || [];

      // Sum quantities from all source items for this SKU
      const totalQty = sourceItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const isInStock = sourceItems.some((item) => item.status === 1); // 1 = enabled/in stock

      return {
        product_id: product.id,
        sku: product.sku,
        qty: totalQty,
        is_in_stock: isInStock,
      };
    } catch (error) {
      log.warn('Inventory fetch error', { sku: product.sku, error: error.message });
      return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
    }
  });

  return await Promise.all(inventoryPromises);
}

/**
 * Create batched inventory fetch promises
 * @param {Array} products - Array of products
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Array} Array of inventory fetch promises
 */
function createInventoryBatches(products, config, bearerToken) {
  const { batching, baseUrl, api } = config.commerce;
  const inventoryPromises = [];
  for (let i = 0; i < products.length; i += batching.inventory) {
    const batch = products.slice(i, i + batching.inventory);
    inventoryPromises.push(fetchInventoryForProducts(batch, bearerToken, baseUrl, api));
  }
  return inventoryPromises;
}

module.exports = {
  fetchInventoryForProducts,
  createInventoryBatches,
  buildSearchCriteria,
};
