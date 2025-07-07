/**
 * Commerce Data Module
 * @module commerce/data
 *
 * This module consolidates commerce-specific data processing functionality.
 * For product validation functions, see src/products/validate.js (single source of truth).
 */

const { getProductFields, getRequestedFields, validateProduct } = require('../products/validate');
const { validateCategory } = require('./data/category');
const { validateInventory } = require('./data/inventory');

/**
 * Validates multiple products and returns aggregated results
 * @param {Array<Object>} products - Products to validate
 * @param {Object} config - Configuration object
 * @returns {Object} Aggregated validation results
 */
function validateProducts(products, config) {
  const results = products.map((product) => validateProduct(product, config));
  const errors = results.filter((result) => !result.isValid);

  return {
    isValid: errors.length === 0,
    validCount: results.length - errors.length,
    invalidCount: errors.length,
    totalCount: results.length,
    errors: errors.flatMap((result) => result.errors),
  };
}

/**
 * Filters product fields based on configuration
 * @param {Object} product - The product object
 * @param {Array} fields - Array of field names to include
 * @returns {Object} Filtered product object
 */
function filterProductFields(product, fields) {
  // Validate inputs
  if (!Array.isArray(fields)) {
    return product;
  }

  if (!product || typeof product !== 'object') {
    return {};
  }

  // Create filtered product with only requested fields
  const filteredProduct = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(product, field)) {
      filteredProduct[field] = product[field];
    }
  });

  // Always preserve media_gallery_entries if present, as it's needed for image transformation
  if (product.media_gallery_entries && fields.includes('images')) {
    filteredProduct.media_gallery_entries = product.media_gallery_entries;
  }

  return filteredProduct;
}

/**
 * Extracts category IDs from a product object
 * @param {Object} product - Product object
 * @returns {Array<string>} Array of category IDs
 */
function getCategoryIds(product) {
  if (!product) return [];

  // Handle direct categories array
  if (Array.isArray(product.categories)) {
    return product.categories
      .map((category) => {
        if (typeof category === 'object' && category.id) {
          return String(category.id);
        }
        return String(category);
      })
      .filter(Boolean);
  }

  // Handle custom_attributes format
  if (Array.isArray(product.custom_attributes)) {
    const categoryAttr = product.custom_attributes.find(
      (attr) => attr.attribute_code === 'category_ids'
    );
    if (categoryAttr && Array.isArray(categoryAttr.value)) {
      return categoryAttr.value.map((id) => String(id));
    }
  }

  return [];
}

/**
 * Processes inventory data from Commerce API response
 * @param {Object} inventoryResponse - API response containing inventory data
 * @returns {Object} Processed inventory data
 */
function processInventoryResponse(inventoryResponse) {
  if (!inventoryResponse || !inventoryResponse.items || !Array.isArray(inventoryResponse.items)) {
    return {
      qty: 0,
      is_in_stock: false,
    };
  }

  const totalQty = inventoryResponse.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const isInStock = inventoryResponse.items.some((item) => item.status === 1);

  return {
    qty: totalQty,
    is_in_stock: isInStock,
  };
}

/**
 * Processes category data from Commerce API response
 * @param {Object} categoryResponse - API response containing category data
 * @returns {Object} Processed category data
 */
function processCategoryResponse(categoryResponse) {
  if (!categoryResponse || !categoryResponse.id) {
    return null;
  }

  return {
    id: String(categoryResponse.id),
    name: categoryResponse.name || '',
    path: categoryResponse.path || '',
    level: categoryResponse.level || 0,
    parent_id: categoryResponse.parent_id || null,
    children: categoryResponse.children || [],
  };
}

/**
 * Creates a category map from array of categories
 * @param {Array<Object>} categories - Array of category objects
 * @returns {Object} Map of category ID to category name
 */
function createCategoryMap(categories) {
  const categoryMap = {};

  if (!Array.isArray(categories)) {
    return categoryMap;
  }

  categories.forEach((category) => {
    if (category && category.id && category.name) {
      categoryMap[String(category.id)] = category.name;
    }
  });

  return categoryMap;
}

/**
 * Enriches product data with category information
 * @param {Object} product - Product object
 * @param {Object} categoryMap - Map of category IDs to names
 * @returns {Object} Product with enriched category data
 */
function enrichProductWithCategories(product, categoryMap) {
  if (!product || !categoryMap) {
    return product;
  }

  const categoryIds = getCategoryIds(product);
  const categories = categoryIds
    .map((id) => ({
      id: String(id),
      name: categoryMap[String(id)] || `Category ${id}`,
    }))
    .filter((category) => category.name !== `Category ${category.id}`);

  return {
    ...product,
    categories,
  };
}

/**
 * Enriches product data with inventory information
 * @param {Object} product - Product object
 * @param {Object} inventoryData - Inventory data object
 * @returns {Object} Product with enriched inventory data
 */
function enrichProductWithInventory(product, inventoryData) {
  if (!product || !inventoryData) {
    return product;
  }

  return {
    ...product,
    qty: inventoryData.qty || 0,
    is_in_stock: inventoryData.is_in_stock || false,
    inventory: inventoryData,
  };
}

/**
 * Normalizes core product identification fields
 * @param {Object} product - Product object
 * @returns {Object} Normalized core fields
 */
function normalizeProductCore(product) {
  return {
    id: product.id || null,
    sku: product.sku || '',
    name: product.name || '',
  };
}

/**
 * Normalizes product pricing and inventory fields
 * @param {Object} product - Product object
 * @returns {Object} Normalized pricing and inventory fields
 */
function normalizeProductPricing(product) {
  return {
    price: product.price || 0,
    qty: product.qty || 0,
    is_in_stock: product.is_in_stock || false,
  };
}

/**
 * Normalizes product array fields
 * @param {Object} product - Product object
 * @returns {Object} Normalized array fields
 */
function normalizeProductArrays(product) {
  return {
    categories: product.categories || [],
    media_gallery_entries: product.media_gallery_entries || [],
    custom_attributes: product.custom_attributes || [],
  };
}

/**
 * Normalizes product data to ensure consistent structure
 * @param {Object} product - Product object to normalize
 * @returns {Object} Normalized product object
 */
function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    ...normalizeProductCore(product),
    ...normalizeProductPricing(product),
    ...normalizeProductArrays(product),
    ...product, // Preserve any additional fields
  };
}

module.exports = {
  getProductFields,
  getRequestedFields,
  validateProduct,
  validateProducts,
  filterProductFields,
  getCategoryIds,
  validateCategory,
  validateInventory,
  processInventoryResponse,
  processCategoryResponse,
  createCategoryMap,
  enrichProductWithCategories,
  enrichProductWithInventory,
  normalizeProduct,
};
