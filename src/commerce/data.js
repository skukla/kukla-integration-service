/**
 * Commerce Data Module
 * @module commerce/data
 *
 * Provides Commerce data validation, handling, and utility functions.
 * Consolidates product, category, and inventory data functionality.
 * Uses functional composition with pure functions and clear input/output contracts.
 */

const { loadConfig } = require('../../config');

/**
 * Gets product fields with parameter support
 * @param {Object} [params] - Action parameters
 * @returns {Array} Product fields array
 */
function getProductFields(params = {}) {
  const config = loadConfig(params);
  return config.products.fields;
}

/**
 * Gets the list of fields to include in the response
 * @param {Object} params - Request parameters
 * @param {Array<string>} [params.fields] - Optional array of field names to include
 * @returns {Array<string>} Array of field names to include
 * @throws {Error} When invalid fields are requested
 */
function getRequestedFields(params) {
  const PRODUCT_FIELDS = getProductFields(params);

  if (!Array.isArray(params.fields) || params.fields.length === 0) {
    return PRODUCT_FIELDS;
  }

  // Validate that all requested fields are available
  const invalidFields = params.fields.filter((field) => !PRODUCT_FIELDS.includes(field));
  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid fields requested: ${invalidFields.join(', ')}. Available fields are: ${PRODUCT_FIELDS.join(', ')}`
    );
  }

  return params.fields;
}

/**
 * Validates product data against configuration rules
 * @param {Object} product - Product data to validate
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Validation result with any errors
 */
function validateProduct(product, params = {}) {
  const errors = [];
  const config = loadConfig(params);
  const VALIDATION_RULES = config.products.validation || {};

  // Check required fields (sku and name are always required)
  if (!product.sku) {
    errors.push('Missing required field: sku');
  }
  if (!product.name) {
    errors.push('Missing required field: name');
  }

  // Validate field values against rules
  Object.entries(VALIDATION_RULES).forEach(([field, rules]) => {
    if (product[field]) {
      if (rules.pattern && !new RegExp(rules.pattern).test(product[field])) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.minLength && product[field].length < rules.minLength) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.maxLength && product[field].length > rules.maxLength) {
        errors.push(`${field}: ${rules.message}`);
      }
      if (rules.min !== undefined && product[field] < rules.min) {
        errors.push(`${field}: ${rules.message}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple products and returns aggregated results
 * @param {Array<Object>} products - Products to validate
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Aggregated validation results
 */
function validateProducts(products, params = {}) {
  const results = products.map((product) => validateProduct(product, params));
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
 * Validates category data
 * @param {Object} category - Category data to validate
 * @returns {Object} Validation result
 */
function validateCategory(category) {
  const errors = [];

  if (!category.id) {
    errors.push('Missing required field: id');
  }
  if (!category.name) {
    errors.push('Missing required field: name');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates inventory data
 * @param {Object} inventory - Inventory data to validate
 * @returns {Object} Validation result
 */
function validateInventory(inventory) {
  const errors = [];

  if (inventory.qty === undefined || inventory.qty === null) {
    errors.push('Missing required field: qty');
  }
  if (typeof inventory.qty !== 'number' || inventory.qty < 0) {
    errors.push('Invalid qty: must be a non-negative number');
  }
  if (typeof inventory.is_in_stock !== 'boolean') {
    errors.push('Invalid is_in_stock: must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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
 * Normalizes product data to ensure consistent structure
 * @param {Object} product - Product object to normalize
 * @returns {Object} Normalized product object
 */
function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    id: product.id || null,
    sku: product.sku || '',
    name: product.name || '',
    price: product.price || 0,
    qty: product.qty || 0,
    is_in_stock: product.is_in_stock || false,
    categories: product.categories || [],
    media_gallery_entries: product.media_gallery_entries || [],
    custom_attributes: product.custom_attributes || [],
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
