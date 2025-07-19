/**
 * Commerce Shared Normalization Utilities
 * Normalization functions shared across 3+ features in the commerce domain
 *
 * Consolidated from utils/data-validation.js and product-fetching/data-processing.js
 */

/**
 * Normalize product core fields for commerce operations
 * @purpose Standardize core product fields for consistent commerce processing
 * @param {Object} product - Product object to normalize
 * @returns {Object} Object with normalized core fields
 * @usedBy product-fetching, data-transformation, admin-token-auth (3+ features)
 */
function normalizeProductCore(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    id: parseInt(product.id) || 0,
    sku: String(product.sku || ''),
    name: String(product.name || ''),
    status: parseInt(product.status) || 0,
    type_id: String(product.type_id || 'simple'),
    attribute_set_id: parseInt(product.attribute_set_id) || 0,
  };
}

/**
 * Normalize product pricing fields for commerce operations
 * @purpose Standardize pricing fields for consistent commerce processing
 * @param {Object} product - Product object to normalize
 * @returns {Object} Object with normalized pricing fields
 * @usedBy product-fetching, data-transformation, admin-token-auth (3+ features)
 */
function normalizeProductPricing(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    price: parseFloat(product.price) || 0,
    special_price: product.special_price ? parseFloat(product.special_price) : null,
    cost: product.cost ? parseFloat(product.cost) : null,
    weight: product.weight ? parseFloat(product.weight) : null,
  };
}

/**
 * Normalize product array fields for commerce operations
 * @purpose Standardize array fields for consistent commerce processing
 * @param {Object} product - Product object to normalize
 * @returns {Object} Object with normalized array fields
 * @usedBy product-fetching, data-transformation, admin-token-auth (3+ features)
 */
function normalizeProductArrays(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    category_ids: Array.isArray(product.category_ids) ? product.category_ids : [],
    media_gallery_entries: Array.isArray(product.media_gallery_entries)
      ? product.media_gallery_entries
      : [],
    custom_attributes: Array.isArray(product.custom_attributes) ? product.custom_attributes : [],
    tier_prices: Array.isArray(product.tier_prices) ? product.tier_prices : [],
  };
}

/**
 * Normalize complete product for commerce operations
 * @purpose Apply all normalization rules to create consistent product format
 * @param {Object} product - Product object to normalize
 * @returns {Object} Fully normalized product object
 * @usedBy product-fetching, data-transformation, admin-token-auth (3+ features)
 */
function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    ...normalizeProductCore(product),
    ...normalizeProductPricing(product),
    ...normalizeProductArrays(product),
    ...product, // Preserve any additional fields not handled above
  };
}

/**
 * Normalize an array of products for commerce operations
 * @purpose Apply normalization to multiple products consistently
 * @param {Array} products - Array of product objects to normalize
 * @returns {Array} Array of normalized product objects
 * @usedBy product-fetching, batch processing features
 */
function normalizeProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => normalizeProduct(product));
}

module.exports = {
  normalizeProductCore,
  normalizeProductPricing,
  normalizeProductArrays,
  normalizeProduct,
  normalizeProducts,
};
