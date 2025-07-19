/**
 * Inventory Enrichment - Data Application Sub-module
 * All inventory data application and SKU extraction utilities
 */

// Data Application Workflows

/**
 * Apply inventory data to products with comprehensive stock mapping
 * @purpose Map fetched inventory data to products with support for different stock data formats
 * @param {Array} products - Array of product objects to enhance with inventory information
 * @param {Object} inventoryMap - Map of SKU to complete inventory data
 * @returns {Array} Array of products enhanced with complete inventory information
 * @usedBy enrichProductsWithInventoryAndValidation
 */
async function applyInventoryToProducts(products, inventoryMap) {
  return products.map((product) => applyInventoryToSingleProduct(product, inventoryMap));
}

/**
 * Apply inventory data to a single product
 * @param {Object} product - Product to enhance with inventory
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @returns {Object} Product enhanced with inventory information
 */
function applyInventoryToSingleProduct(product, inventoryMap) {
  const inventoryData = inventoryMap[product.sku];

  if (!inventoryData) {
    return createProductWithoutInventory(product);
  }

  return createProductWithInventory(product, inventoryData);
}

/**
 * Create product object when no inventory data is available
 * @param {Object} product - Base product object
 * @returns {Object} Product with default inventory values
 */
function createProductWithoutInventory(product) {
  return {
    ...product,
    qty: 0,
    is_in_stock: false,
    inventory: {
      qty: 0,
      is_in_stock: false,
      stock_status: 'out_of_stock',
    },
  };
}

/**
 * Create product object with inventory data applied
 * @param {Object} product - Base product object
 * @param {Object} inventoryData - Inventory data to apply
 * @returns {Object} Product with complete inventory information
 */
function createProductWithInventory(product, inventoryData) {
  return {
    ...product,
    qty: inventoryData.qty || 0,
    is_in_stock: inventoryData.is_in_stock || false,
    inventory: buildInventoryObject(inventoryData),
    inventoryMetadata: buildInventoryMetadata(inventoryData),
  };
}

/**
 * Build detailed inventory object
 * @param {Object} inventoryData - Raw inventory data
 * @returns {Object} Structured inventory object
 */
function buildInventoryObject(inventoryData) {
  return {
    qty: inventoryData.qty || 0,
    is_in_stock: inventoryData.is_in_stock || false,
    stock_status: inventoryData.stock_status || 'out_of_stock',
    min_qty: inventoryData.min_qty || 0,
    max_sale_qty: inventoryData.max_sale_qty || 10000,
    min_sale_qty: inventoryData.min_sale_qty || 1,
    manage_stock: inventoryData.manage_stock || true,
    backorders: inventoryData.backorders || 0,
    notify_stock_qty: inventoryData.notify_stock_qty || 1,
    item_id: inventoryData.item_id || 0,
    product_id: inventoryData.product_id || 0,
    stock_id: inventoryData.stock_id || 1,
  };
}

/**
 * Build inventory metadata object
 * @param {Object} inventoryData - Raw inventory data
 * @returns {Object} Inventory metadata object
 */
function buildInventoryMetadata(inventoryData) {
  return {
    isEnhanced: inventoryData.isEnhanced || false,
    isFallback: inventoryData.isFallback || false,
    isDefault: inventoryData.isDefault || false,
    enhancedAt: inventoryData.enhancedAt || new Date().toISOString(),
  };
}

// Data Application Utilities

/**
 * Extract unique product SKUs from products
 * @purpose Extract all unique SKUs from product array for efficient inventory fetching
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of unique SKUs
 * @usedBy enrichProductsWithInventoryAndValidation
 */
function extractUniqueProductSkus(products) {
  const skus = [];

  if (!Array.isArray(products)) {
    return skus;
  }

  products.forEach((product) => {
    if (product.sku && typeof product.sku === 'string' && !skus.includes(product.sku)) {
      skus.push(product.sku);
    }
  });

  return skus;
}

module.exports = {
  // Workflows (used by feature core)
  applyInventoryToProducts,

  // Utilities (available for testing/extension)
  extractUniqueProductSkus,
};
