/**
 * Products Data Utilities
 *
 * Low-level pure functions for data processing and normalization.
 * Contains utilities for extracting and transforming product data elements.
 */

/**
 * Get category IDs from a product
 * @param {Object} product - Product object
 * @returns {Array<number>} Array of category IDs
 */
function getCategoryIds(product) {
  const categoryIds = [];

  // Check direct categories array
  if (product.categories && Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      if (cat.id) {
        categoryIds.push(parseInt(cat.id));
      }
    });
  }

  // Check custom_attributes for category_ids
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    const categoryAttr = product.custom_attributes.find(
      (attr) => attr.attribute_code === 'category_ids'
    );
    if (categoryAttr && categoryAttr.value) {
      // Handle different value types
      let catIds = [];
      if (typeof categoryAttr.value === 'string') {
        catIds = categoryAttr.value.split(',');
      } else if (Array.isArray(categoryAttr.value)) {
        catIds = categoryAttr.value.map(String);
      } else {
        catIds = [String(categoryAttr.value)];
      }

      catIds.forEach((id) => {
        const categoryId = parseInt(String(id).trim());
        if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
          categoryIds.push(categoryId);
        }
      });
    }
  }

  return categoryIds;
}

/**
 * Extracts category ID for CSV export
 * Pure function that gets the first category name for CSV format.
 *
 * @param {Array<Object>} [categories] - Array of category objects
 * @returns {string} First category name or empty string
 */
function extractCsvCategoryId(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  const firstCategory = categories[0];

  // If category has a name property, use it
  if (firstCategory && typeof firstCategory === 'object' && firstCategory.name) {
    return firstCategory.name;
  }

  // If it's a string (category name), return it directly
  if (typeof firstCategory === 'string') {
    return firstCategory;
  }

  // Fallback to empty string
  return '';
}

/**
 * Extracts product message for CSV export
 * Pure function that creates a product message from name and description.
 *
 * @param {Object} product - Product object
 * @returns {string} Product message for CSV
 */
function extractProductMessage(product) {
  if (!product || typeof product !== 'object') {
    return '';
  }
  return product.short_description || product.description || product.name || '';
}

/**
 * Converts product price to numeric value
 * Pure function that normalizes price data.
 *
 * @param {*} price - Product price value
 * @returns {number} Numeric price value
 */
function normalizeProductValue(price) {
  return parseFloat(price) || 0;
}

/**
 * Converts product inventory to integer with fallback
 * Pure function that normalizes quantity data.
 *
 * @param {*} qty - Product quantity value
 * @returns {number} Integer quantity value
 */
function normalizeProductInventory(qty) {
  return parseInt(qty, 10) || 0;
}

/**
 * Extracts SKU from product safely
 * Pure function that gets product SKU with fallback.
 *
 * @param {Object} product - Product object
 * @returns {string} Product SKU or empty string
 */
function extractProductSku(product) {
  if (!product || typeof product !== 'object') {
    return '';
  }
  return product.sku || '';
}

/**
 * Extracts product name safely
 * Pure function that gets product name with fallback.
 *
 * @param {Object} product - Product object
 * @returns {string} Product name or empty string
 */
function extractProductName(product) {
  if (!product || typeof product !== 'object') {
    return '';
  }
  return product.name || '';
}

/**
 * Validates required product fields
 * Pure function that checks if product has minimum required data.
 *
 * @param {Object} product - Product object to validate
 * @param {Array<string>} [requiredFields] - Array of required field names
 * @returns {boolean} True if product has all required fields
 */
function validateRequiredProductFields(product, requiredFields = ['sku']) {
  if (!product || typeof product !== 'object') {
    return false;
  }

  return requiredFields.every((field) => {
    const value = product[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Extracts numeric ID from various ID formats
 * Pure function that normalizes ID values to numbers.
 *
 * @param {*} id - ID value in various formats
 * @returns {number|null} Numeric ID or null if invalid
 */
function normalizeId(id) {
  if (id === undefined || id === null || id === '') {
    return null;
  }

  const numericId = parseInt(String(id).trim());
  return isNaN(numericId) ? null : numericId;
}

/**
 * Extracts custom attribute value by code
 * Pure function that finds custom attribute by attribute_code.
 *
 * @param {Object} product - Product object
 * @param {string} attributeCode - Attribute code to find
 * @returns {*} Attribute value or null if not found
 */
function extractCustomAttributeValue(product, attributeCode) {
  if (!product || !product.custom_attributes || !Array.isArray(product.custom_attributes)) {
    return null;
  }

  const attribute = product.custom_attributes.find((attr) => attr.attribute_code === attributeCode);

  return attribute ? attribute.value : null;
}

/**
 * Filters products by criteria
 * Pure function that filters products based on criteria object.
 *
 * @param {Array<Object>} products - Array of product objects
 * @param {Object} criteria - Filter criteria
 * @param {string[]} [criteria.skus] - SKUs to include
 * @param {string[]} [criteria.types] - Product types to include
 * @param {boolean} [criteria.inStock] - Filter by stock status
 * @returns {Array<Object>} Filtered products array
 */
function filterProducts(products, criteria = {}) {
  if (!Array.isArray(products)) {
    return [];
  }

  let filtered = [...products];

  // Filter by SKUs
  if (criteria.skus && Array.isArray(criteria.skus)) {
    filtered = filtered.filter((product) => criteria.skus.includes(product.sku));
  }

  // Filter by types
  if (criteria.types && Array.isArray(criteria.types)) {
    filtered = filtered.filter((product) => criteria.types.includes(product.type_id));
  }

  // Filter by stock status
  if (criteria.inStock !== undefined) {
    filtered = filtered.filter((product) => Boolean(product.is_in_stock) === criteria.inStock);
  }

  return filtered;
}

module.exports = {
  getCategoryIds,
  extractCsvCategoryId,
  extractProductMessage,
  normalizeProductValue,
  normalizeProductInventory,
  extractProductSku,
  extractProductName,
  validateRequiredProductFields,
  normalizeId,
  extractCustomAttributeValue,
  filterProducts,
};
