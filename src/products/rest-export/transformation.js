/**
 * REST Export - Product Transformation Sub-module
 * All product transformation utilities for REST API export
 */

const { extractProductMessage } = require('../shared/data-extraction');
const { normalizeProductValue } = require('../shared/normalization');

// Business Workflows

/**
 * Build complete product objects for export
 * @purpose Transform raw Commerce products into complete export-ready product objects
 * @param {Array} products - Raw product data from Commerce API
 * @returns {Array} Array of complete product objects ready for CSV export
 * @usedBy REST export workflows requiring full product transformation
 */
function buildProducts(products) {
  return products.map((product) => buildProductObject(product));
}

// Feature Operations

/**
 * Build base product fields for export
 * @purpose Extract and format basic product fields required for all exports
 * @param {Object} product - Raw product data from Commerce
 * @returns {Object} Object containing base product fields
 * @usedBy Product transformation workflows requiring core product data
 */
function buildBaseProductFields(product) {
  return {
    id: product.id,
    sku: product.sku,
    name: extractProductMessage(product, 'name'),
    description: extractProductMessage(product, 'description'),
    short_description: extractProductMessage(product, 'short_description'),
    type_id: product.type_id,
  };
}

/**
 * Build product metadata fields
 * @purpose Extract product metadata and timestamps
 * @param {Object} product - Raw product data from Commerce
 * @returns {Object} Object containing product metadata
 * @usedBy Product transformation workflows requiring metadata
 */
function buildProductMetadata(product) {
  return {
    status: product.status,
    visibility: getVisibilityText(product.visibility),
    created_at: product.created_at,
    updated_at: product.updated_at,
    weight: normalizeProductValue(product.weight),
    attribute_set_id: product.attribute_set_id,
  };
}

/**
 * Build product pricing fields
 * @purpose Extract and format product pricing information
 * @param {Object} product - Raw product data from Commerce
 * @returns {Object} Object containing pricing fields
 * @usedBy Product transformation workflows requiring pricing data
 */
function buildProductPricing(product) {
  return {
    price: normalizeProductValue(product.price),
    special_price: normalizeProductValue(product.special_price),
    cost: normalizeProductValue(product.cost),
    msrp: normalizeProductValue(product.msrp),
  };
}

/**
 * Add inventory fields to product
 * @purpose Append inventory information to existing product object
 * @param {Object} productObj - Base product object to enhance
 * @param {Object} product - Raw product with inventory data
 * @returns {Object} Product object with inventory fields added
 * @usedBy Product enrichment requiring inventory integration
 */
function addInventoryFields(productObj, product) {
  return {
    ...productObj,
    qty: product.inventory ? product.inventory.qty : '',
    is_in_stock: product.inventory ? product.inventory.is_in_stock : '',
    stock_status: product.inventory ? product.inventory.stock_status : '',
    manage_stock: product.inventory ? product.inventory.manage_stock : '',
  };
}

/**
 * Add category fields to product
 * @purpose Append category information to existing product object
 * @param {Object} productObj - Base product object to enhance
 * @param {Object} product - Raw product with category data
 * @returns {Object} Product object with category fields added
 * @usedBy Product enrichment requiring category integration
 */
function addCategoryFields(productObj, product) {
  return {
    ...productObj,
    categories: buildCategoryString(product.categories || []),
    category_ids: product.category_links
      ? product.category_links.map((link) => link.category_id).join(',')
      : '',
  };
}

/**
 * Add image fields to product
 * @purpose Append image information to existing product object
 * @param {Object} productObj - Base product object to enhance
 * @param {Object} product - Raw product with image data
 * @returns {Object} Product object with image fields added
 * @usedBy Product enrichment requiring image integration
 */
function addImageFields(productObj, product) {
  return {
    ...productObj,
    images: buildImageString(product.media_gallery_entries || []),
    thumbnail: product.thumbnail || '',
    small_image: product.small_image || '',
    base_image: product.base_image || '',
  };
}

/**
 * Add custom attributes to product
 * @purpose Append custom attribute information to existing product object
 * @param {Object} productObj - Base product object to enhance
 * @param {Object} product - Raw product with custom attributes
 * @returns {Object} Product object with custom attributes added
 * @usedBy Product enrichment requiring custom attribute integration
 */
function addCustomAttributes(productObj, product) {
  const customAttributes = {};

  if (product.custom_attributes) {
    product.custom_attributes.forEach((attr) => {
      if (attr.attribute_code && attr.value !== undefined) {
        customAttributes[attr.attribute_code] = attr.value;
      }
    });
  }

  return { ...productObj, ...customAttributes };
}

// Feature Utilities

/**
 * Build complete product object
 * @purpose Create complete product object with all fields for export
 * @param {Object} product - Raw product data from Commerce
 * @returns {Object} Complete product object ready for export
 * @usedBy Product transformation workflows requiring complete product data
 */
function buildProductObject(product) {
  let productObj = buildBaseProductFields(product);

  productObj = addInventoryFields(productObj, product);
  productObj = addCategoryFields(productObj, product);
  productObj = addImageFields(productObj, product);
  productObj = addCustomAttributes(productObj, product);

  return productObj;
}

/**
 * Build product for export
 * @purpose Create product object specifically formatted for export requirements
 * @param {Object} product - Raw product data from Commerce
 * @returns {Object} Export-ready product object
 * @usedBy Export workflows requiring standardized product format
 */
function buildProduct(product) {
  return buildProductObject(product);
}

/**
 * Get visibility text representation
 * @purpose Convert numeric visibility code to human-readable text
 * @param {number} visibility - Numeric visibility code from Commerce
 * @returns {string} Human-readable visibility text
 * @usedBy Product metadata building requiring visibility translation
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
 * Build category string representation
 * @purpose Convert category array to string representation for export
 * @param {Array} categories - Array of category objects
 * @returns {string} Formatted category string for export
 * @usedBy Category field building requiring string representation
 */
function buildCategoryString(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  return categories.map((cat) => cat.name || cat).join(', ');
}

/**
 * Build image string representation
 * @purpose Convert image array to string representation for export
 * @param {Array} images - Array of image objects from media gallery
 * @returns {string} Formatted image string for export
 * @usedBy Image field building requiring string representation
 */
function buildImageString(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }

  return images
    .filter((img) => img.file)
    .map((img) => img.file)
    .join(', ');
}

module.exports = {
  // Business workflows
  buildProducts,

  // Feature operations
  buildBaseProductFields,
  buildProductMetadata,
  buildProductPricing,
  addInventoryFields,
  addCategoryFields,
  addImageFields,
  addCustomAttributes,

  // Feature utilities
  buildProductObject,
  buildProduct,
  getVisibilityText,
  buildCategoryString,
  buildImageString,
};
