/**
 * REST Export - Product Transformation Sub-module
 * All product transformation and object building utilities for REST API export
 */

const { extractProductMessage } = require('../shared/data-extraction');
const { normalizeProductValue, normalizeProductInventory } = require('../shared/normalization');
const { transformImageEntry, getPrimaryImageUrl } = require('../utils/image');

// Transformation Workflows

/**
 * Build products from enriched data
 * @purpose Transform enriched products into standardized format for export
 * @param {Array} products - Array of enriched product objects
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of built product objects ready for CSV
 * @usedBy exportProducts in rest-export.js
 */
async function buildProducts(products, config) {
  return products.map((product) => {
    return buildProductObject(product, {}, config);
  });
}

// Transformation Utilities

/**
 * Build base product fields
 * @purpose Create base product object with core fields
 * @param {Object} product - Raw product data from Commerce API
 * @returns {Object} Base product object
 * @usedBy buildProductObject
 */
function buildBaseProductFields(product) {
  return {
    ...buildCoreFields(product),
    ...buildMetadataFields(product),
    ...buildPriceFields(product),
  };
}

/**
 * Build core product identification fields
 * @purpose Create SKU, name, and description fields
 * @param {Object} product - Raw product data from Commerce API
 * @returns {Object} Core product fields
 * @usedBy buildBaseProductFields
 */
function buildCoreFields(product) {
  return {
    sku: product.sku || '',
    name: product.name || '',
    description: extractProductMessage(product, 'description') || '',
    short_description: extractProductMessage(product, 'short_description') || '',
    type_id: product.type_id || '',
  };
}

/**
 * Build product metadata fields
 * @purpose Create status, visibility, weight, and timestamp fields
 * @param {Object} product - Raw product data from Commerce API
 * @returns {Object} Metadata product fields
 * @usedBy buildBaseProductFields
 */
function buildMetadataFields(product) {
  return {
    status: product.status === 1 ? 'Enabled' : 'Disabled',
    visibility: getVisibilityText(product.visibility),
    weight: normalizeProductValue(product.weight) || '',
    created_at: product.created_at || '',
    updated_at: product.updated_at || '',
  };
}

/**
 * Build product price fields
 * @purpose Create price and special price fields
 * @param {Object} product - Raw product data from Commerce API
 * @returns {Object} Price product fields
 * @usedBy buildBaseProductFields
 */
function buildPriceFields(product) {
  return {
    price: normalizeProductValue(product.price) || '0',
    special_price: normalizeProductValue(product.special_price) || '',
  };
}

/**
 * Add inventory fields to product object
 * @purpose Add quantity and stock information
 * @param {Object} builtProduct - Product object to modify
 * @param {Object} product - Source product data
 * @returns {void}
 * @usedBy buildProductObject
 */
function addInventoryFields(builtProduct, product) {
  if (product.inventory) {
    builtProduct.qty = normalizeProductInventory(product.inventory.qty);
    builtProduct.is_in_stock = product.inventory.is_in_stock ? 'Yes' : 'No';
  } else {
    builtProduct.qty = '';
    builtProduct.is_in_stock = '';
  }
}

/**
 * Add category fields to product object
 * @purpose Add category information
 * @param {Object} builtProduct - Product object to modify
 * @param {Object} product - Source product data
 * @returns {void}
 * @usedBy buildProductObject
 */
function addCategoryFields(builtProduct, product) {
  if (product.categories && product.categories.length > 0) {
    builtProduct.categories = buildCategoryString(product.categories);
    builtProduct.category_ids = product.categories.map((cat) => cat.id).join(',');
  } else {
    builtProduct.categories = '';
    builtProduct.category_ids = '';
  }
}

/**
 * Add image fields to product object
 * @purpose Add image information
 * @param {Object} builtProduct - Product object to modify
 * @param {Object} product - Source product data
 * @returns {void}
 * @usedBy buildProductObject
 */
function addImageFields(builtProduct, product) {
  if (product.media_gallery_entries && product.media_gallery_entries.length > 0) {
    builtProduct.images = buildImageString(product.media_gallery_entries);
    builtProduct.image = getPrimaryImageUrl(product.media_gallery_entries);
  } else {
    builtProduct.images = '';
    builtProduct.image = '';
  }
}

/**
 * Add custom attributes to product object
 * @purpose Add custom product attributes
 * @param {Object} builtProduct - Product object to modify
 * @param {Object} product - Source product data
 * @returns {void}
 * @usedBy buildProductObject
 */
function addCustomAttributes(builtProduct, product) {
  if (product.custom_attributes) {
    product.custom_attributes.forEach((attr) => {
      const fieldName = `custom_${attr.attribute_code}`;
      builtProduct[fieldName] = attr.value || '';
    });
  }
}

/**
 * Build standardized product object for export
 * @purpose Create complete product object with all required fields for CSV export
 * @param {Object} product - Raw product data from Commerce API
 * @param {Object} categoryMap - Map of category data (legacy parameter, maintained for compatibility)
 * @param {Object} config - Configuration object
 * @returns {Object} Standardized product object
 * @usedBy buildProducts
 */
function buildProductObject(product) {
  const builtProduct = buildBaseProductFields(product);

  addInventoryFields(builtProduct, product);
  addCategoryFields(builtProduct, product);
  addImageFields(builtProduct, product);
  addCustomAttributes(builtProduct, product);

  return builtProduct;
}

/**
 * Build complete product data for export (legacy function)
 * @purpose Create product object with categories and inventory (legacy compatibility)
 * @param {Object} product - Product data
 * @param {Array} categories - Category data array
 * @param {Object} inventory - Inventory data object
 * @returns {Object} Built product object
 * @usedBy legacy functions for backward compatibility
 */
function buildProduct(product, categories = [], inventory = {}) {
  return {
    sku: product.sku || '',
    name: product.name || '',
    price: product.price || '0',
    categories: buildCategoryString(categories),
    qty: inventory.qty || '0',
    is_in_stock: inventory.is_in_stock ? 'Yes' : 'No',
    images: product.media_gallery_entries ? buildImageString(product.media_gallery_entries) : '',
  };
}

/**
 * Get human-readable visibility text
 * @purpose Convert numeric visibility code to readable text
 * @param {number} visibility - Numeric visibility code from Commerce API
 * @returns {string} Human-readable visibility text
 * @usedBy buildProductObject
 */
function getVisibilityText(visibility) {
  const visibilityMap = {
    1: 'Not Visible Individually',
    2: 'Catalog',
    3: 'Search',
    4: 'Catalog, Search',
  };

  return visibilityMap[visibility] || 'Unknown';
}

/**
 * Build category string from category data
 * @purpose Create comma-separated string of category names
 * @param {Array} categories - Array of category objects
 * @returns {string} Comma-separated category names
 * @usedBy buildProductObject, buildProduct
 */
function buildCategoryString(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  return categories
    .map((category) => category.name || category)
    .filter((name) => name)
    .join(', ');
}

/**
 * Build image string from media gallery entries
 * @purpose Create comma-separated string of image URLs
 * @param {Array} mediaEntries - Array of media gallery entries
 * @returns {string} Comma-separated image URLs
 * @usedBy buildProductObject, buildProduct
 */
function buildImageString(mediaEntries) {
  if (!Array.isArray(mediaEntries) || mediaEntries.length === 0) {
    return '';
  }

  return mediaEntries
    .map((entry) => transformImageEntry(entry))
    .filter((url) => url)
    .join(', ');
}

module.exports = {
  // Workflows (used by feature core)
  buildProducts,

  // Utilities (available for testing/extension)
  buildProductObject,
  buildProduct,
  getVisibilityText,
  buildCategoryString,
  buildImageString,
};
