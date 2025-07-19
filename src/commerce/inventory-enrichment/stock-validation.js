/**
 * Inventory Enrichment - Stock Validation Sub-module
 * All inventory validation, rules application, and enhancement utilities
 */

// Stock Validation Workflows

/**
 * Validate inventory data and apply stock rules
 * @purpose Apply comprehensive stock validation and business rules to inventory data
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @param {Object} [options={}] - Validation and rule application options
 * @returns {Object} Enhanced inventory map with validated and rule-applied data
 * @usedBy enrichProductsWithInventoryAndValidation
 */
function validateAndApplyStockRules(inventoryMap, options = {}) {
  const enhancedInventoryMap = {};

  Object.entries(inventoryMap).forEach(([sku, inventory]) => {
    if (inventory) {
      enhancedInventoryMap[sku] = validateAndEnhanceInventoryData(inventory, options);
    } else {
      enhancedInventoryMap[sku] = applyDefaultStockData(sku, options);
    }
  });

  return enhancedInventoryMap;
}

// Stock Validation Utilities

/**
 * Validate and enhance individual inventory data
 * @purpose Validate inventory data structure and enhance with business rules and metadata
 * @param {Object} inventory - Inventory data to validate and enhance
 * @param {Object} [options={}] - Validation options including business rules
 * @returns {Object} Enhanced inventory data with validation metadata
 * @usedBy validateAndApplyStockRules
 */
function validateAndEnhanceInventoryData(inventory, options = {}) {
  if (!inventory || typeof inventory !== 'object') {
    return null;
  }

  // Create enhanced inventory with normalized fields
  const enhancedInventory = normalizeInventoryFields(inventory);

  // Apply business rules if enabled
  if (options.applyBusinessRules !== false) {
    applyBusinessRulesToInventory(enhancedInventory);
  }

  // Add validation metadata if requested
  if (options.includeValidation) {
    enhancedInventory.validation = generateStockValidationMetadata(enhancedInventory);
  }

  return enhancedInventory;
}

/**
 * Normalize inventory fields to consistent types and defaults
 * @param {Object} inventory - Raw inventory data
 * @returns {Object} Normalized inventory object
 */
function normalizeInventoryFields(inventory) {
  return {
    item_id: inventory.item_id || 0,
    product_id: inventory.product_id || 0,
    stock_id: inventory.stock_id || 1,
    qty: parseFloat(inventory.qty) || 0,
    is_in_stock: Boolean(inventory.is_in_stock),
    min_qty: parseFloat(inventory.min_qty) || 0,
    max_sale_qty: parseFloat(inventory.max_sale_qty) || 10000,
    min_sale_qty: parseFloat(inventory.min_sale_qty) || 1,
    manage_stock: Boolean(inventory.manage_stock),
    backorders: inventory.backorders || 0,
    notify_stock_qty: parseFloat(inventory.notify_stock_qty) || 1,
    sku: inventory.sku || '',
    stock_status: inventory.stock_status || 'in_stock',
    isEnhanced: true,
    enhancedAt: new Date().toISOString(),
  };
}

/**
 * Apply business rules to inventory data
 * @param {Object} enhancedInventory - Inventory object to apply rules to
 */
function applyBusinessRulesToInventory(enhancedInventory) {
  // Rule: Stock status should reflect actual quantity
  if (enhancedInventory.manage_stock) {
    enhancedInventory.is_in_stock = enhancedInventory.qty > 0;
    enhancedInventory.stock_status = enhancedInventory.qty > 0 ? 'in_stock' : 'out_of_stock';
  }

  // Rule: If quantity is below minimum, apply low stock warning
  if (enhancedInventory.qty <= enhancedInventory.min_qty && enhancedInventory.min_qty > 0) {
    enhancedInventory.stock_status = 'low_stock';
  }
}

/**
 * Apply default stock data for missing inventory
 * @purpose Create default inventory data when no stock information is available
 * @param {string} sku - Product SKU for default data
 * @param {Object} [options={}] - Default data options
 * @returns {Object} Default inventory data
 * @usedBy validateAndApplyStockRules
 */
function applyDefaultStockData(sku, options = {}) {
  const defaultQty = options.defaultQty || 0;
  const defaultStockStatus = options.defaultStockStatus || 'out_of_stock';

  return {
    item_id: 0,
    product_id: 0,
    stock_id: 1,
    qty: defaultQty,
    is_in_stock: defaultQty > 0,
    min_qty: 0,
    max_sale_qty: 10000,
    min_sale_qty: 1,
    manage_stock: true,
    backorders: 0,
    notify_stock_qty: 1,
    sku: sku,
    stock_status: defaultStockStatus,
    isDefault: true,
    defaultReason: options.defaultReason || 'No inventory data available',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate stock validation metadata
 * @purpose Create validation status information for inventory quality assessment
 * @param {Object} inventory - Inventory data to validate
 * @returns {Object} Validation metadata with quality indicators
 * @usedBy validateAndEnhanceInventoryData
 */
function generateStockValidationMetadata(inventory) {
  return {
    hasValidQty: typeof inventory.qty === 'number' && inventory.qty >= 0,
    hasStockStatus: !!inventory.stock_status,
    stockConsistency: inventory.is_in_stock === inventory.qty > 0,
    hasMinQty: typeof inventory.min_qty === 'number',
    hasMaxSaleQty: typeof inventory.max_sale_qty === 'number',
    managesStock: Boolean(inventory.manage_stock),
  };
}

module.exports = {
  // Workflows (used by feature core)
  validateAndApplyStockRules,

  // Utilities (available for testing/extension)
  validateAndEnhanceInventoryData,
  applyDefaultStockData,
  generateStockValidationMetadata,
};
