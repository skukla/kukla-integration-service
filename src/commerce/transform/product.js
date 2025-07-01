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
  product: { PRODUCT_FIELDS },
} = require('../data');

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
  // Determine the appropriate URL
  let url;
  if (img.url) {
    // Use the provided URL if available
    url = img.url;
  } else if (img.file && img.file.startsWith('http')) {
    // If file is already a full URL, use it directly
    url = img.file;
  } else {
    // Construct catalog URL for relative paths
    url = `catalog/product${img.file}`;
  }

  const imageObj = {
    filename: img.file,
    url: url,
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
 * Builds a product object with all fields.
 * @param {Object} product - The product object from Adobe Commerce
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @returns {Object} Transformed product object
 */
function buildProductObject(product, categoryMap) {
  const fieldMappings = {
    sku: () => product.sku,
    name: () => product.name,
    price: () => product.price,
    qty: () => product.qty || 0,
    categories: () => {
      // If categories are already enriched (have name property), use them directly
      if (
        product.categories &&
        Array.isArray(product.categories) &&
        product.categories.length > 0 &&
        product.categories[0].name
      ) {
        return product.categories.map((cat) => cat.name);
      }
      // Otherwise, use the category mapping approach
      const categoryIds = getCategoryIds(product);
      const categoryNames = categoryIds.map((id) => categoryMap[String(id)]).filter(Boolean);
      return categoryNames;
    },
    images: () => (product.media_gallery_entries || []).map(transformImageEntry),
  };

  const result = transformObject(product, fieldMappings, PRODUCT_FIELDS);

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
    category_id: Array.isArray(product.categories)
      ? typeof product.categories[0] === 'string'
        ? product.categories[0]
        : product.categories[0] && product.categories[0].name
          ? product.categories[0].name
          : ''
      : '',
    message: product.description || '',
    thumbnail_url: getPrimaryImageUrl(product.images),
    value: product.price,
    page_url: product.url || '',
    inventory: product.qty,
    margin: product.margin || '',
    type: product.type_id || '',
    custom2: '',
    custom3: '',
    custom4: '',
    custom5: '',
    custom6: '',
    custom7: '',
    custom8: '',
    custom9: '',
    custom10: '',
  };
}

module.exports = {
  PRODUCT_FIELDS,
  buildProductObject,
  mapProductToCsvRow,
};
