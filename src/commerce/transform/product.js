/**
 * Product transformation utilities
 * @module commerce/transform/product
 */

const {
  data: { transformObject },
} = require('../../core');
const {
  category: { getCategoryIds },
} = require('../data');
const {
  product: { PRODUCT_FIELDS, getRequestedFields: getProductFields },
} = require('../data');

/**
 * Returns the list of fields to include in the response.
 * @param {Object} params - The action input parameters
 * @param {Array<string>} [params.fields] - Optional array of field names to include
 * @returns {Array<string>} Array of field names to include in the response
 */
function getRequestedFields(params) {
  return getProductFields(params);
}

/**
 * Transforms a media gallery entry into a simplified image object.
 * @private
 * @param {Object} img - Media gallery entry from Adobe Commerce
 * @param {string} img.file - Image file path
 * @param {number} img.position - Image position/order
 * @param {Array<string>} [img.types] - Image type/role identifiers
 * @returns {Object} Simplified image object
 */
function transformImageEntry(img) {
  const imageObj = {
    filename: img.file,
    url: img.url || `catalog/product${img.file}`, // Add URL if present or construct from file path
    position: img.position,
  };
  if (img.types && img.types.length > 0) {
    imageObj.roles = img.types;
  }
  return imageObj;
}

/**
 * Gets the primary image URL from a product's images array
 * @private
 * @param {Object[]} [images] - Array of product image objects
 * @returns {string} Primary image URL or empty string if none exists
 */
function getPrimaryImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }
  // Handle both URL and filename formats
  return images[0].url || images[0].filename || '';
}

/**
 * Builds a product object with only the requested fields.
 * @param {Object} product - The product object from Adobe Commerce
 * @param {Array<string>} requestedFields - Fields to include in the output
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @returns {Object} Filtered product object with only requested fields
 */
function buildProductObject(product, requestedFields, categoryMap) {
  const fieldMappings = {
    sku: () => product.sku,
    name: () => product.name,
    price: () => product.price,
    qty: () => product.qty || 0,
    categories: () => {
      const categoryIds = getCategoryIds(product);
      const categoryNames = categoryIds.map((id) => categoryMap[String(id)]).filter(Boolean);
      return categoryNames;
    },
    images: () => (product.media_gallery_entries || []).map(transformImageEntry),
  };

  const result = transformObject(product, fieldMappings, requestedFields);

  // Add performance metrics
  result.performance = {
    productCount: 1,
    categoryCount: result.categories ? result.categories.length : 0,
  };

  return result;
}

/**
 * Maps a product object to a CSV row
 * @param {Object} product - Product object
 * @returns {Object} CSV row object
 */
function mapProductToCsvRow(product) {
  return {
    sku: product.sku,
    name: product.name,
    price: product.price,
    qty: product.qty,
    categories: Array.isArray(product.categories) ? product.categories.join(',') : '',
    base_image: getPrimaryImageUrl(product.images),
  };
}

module.exports = {
  PRODUCT_FIELDS,
  getRequestedFields,
  buildProductObject,
  mapProductToCsvRow,
};
