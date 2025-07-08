/**
 * Commerce Data Validation Utilities
 *
 * Low-level pure functions for validating and normalizing Commerce data.
 * Contains validation logic for products, categories, and inventory data.
 */

const {
  getProductFields,
  getRequestedFields,
  validateProduct,
} = require('../../core/validation/operations/product');
// Category and inventory validation should be handled by the products domain
// validateCategory and validateInventory functions moved to products/utils/validation.js

// ✅ BOUNDARY VIOLATION FIXED: Now importing from core domain instead of products domain
// This eliminates the circular dependency between commerce and products domains

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

/**
 * Validates that a product has required fields
 * @param {Object} product - Product object
 * @param {Array<string>} requiredFields - Required field names
 * @returns {Object} Validation result
 */
function validateRequiredFields(product, requiredFields = ['sku', 'name']) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    return {
      isValid: false,
      errors: ['Product must be an object'],
    };
  }

  requiredFields.forEach((field) => {
    if (!product[field] || (typeof product[field] === 'string' && product[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates product pricing data
 * @param {Object} product - Product object
 * @returns {Object} Validation result
 */
function validateProductPricing(product) {
  const errors = [];

  if (product.price !== undefined && (typeof product.price !== 'number' || product.price < 0)) {
    errors.push('Price must be a non-negative number');
  }

  if (product.qty !== undefined && (typeof product.qty !== 'number' || product.qty < 0)) {
    errors.push('Quantity must be a non-negative number');
  }

  if (product.is_in_stock !== undefined && typeof product.is_in_stock !== 'boolean') {
    errors.push('is_in_stock must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates product array fields
 * @param {Object} product - Product object
 * @returns {Object} Validation result
 */
function validateProductArrays(product) {
  const errors = [];

  if (product.categories !== undefined && !Array.isArray(product.categories)) {
    errors.push('Categories must be an array');
  }

  if (
    product.media_gallery_entries !== undefined &&
    !Array.isArray(product.media_gallery_entries)
  ) {
    errors.push('Media gallery entries must be an array');
  }

  if (product.custom_attributes !== undefined && !Array.isArray(product.custom_attributes)) {
    errors.push('Custom attributes must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates complete product structure
 * @param {Object} product - Product object
 * @param {Object} [options] - Validation options
 * @param {Array<string>} [options.requiredFields] - Required field names
 * @returns {Object} Complete validation result
 */
function validateProductStructure(product, options = {}) {
  const { requiredFields = ['sku', 'name'] } = options;

  const requiredValidation = validateRequiredFields(product, requiredFields);
  const pricingValidation = validateProductPricing(product);
  const arrayValidation = validateProductArrays(product);

  const allErrors = [
    ...requiredValidation.errors,
    ...pricingValidation.errors,
    ...arrayValidation.errors,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldValidation: {
      required: requiredValidation,
      pricing: pricingValidation,
      arrays: arrayValidation,
    },
  };
}

module.exports = {
  // Re-export from products domain
  getProductFields,
  getRequestedFields,
  validateProduct,
  // Commerce-specific validation functions
  validateProducts,
  filterProductFields,
  getCategoryIds,
  // Normalization functions
  normalizeProductCore,
  normalizeProductPricing,
  normalizeProductArrays,
  normalizeProduct,
  // Structure validation functions
  validateRequiredFields,
  validateProductPricing,
  validateProductArrays,
  validateProductStructure,
};
