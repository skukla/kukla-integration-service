/**
 * Commerce Transform Module
 * @module commerce/transform
 *
 * Provides Commerce data transformation functionality for products, images, and CSV generation.
 * Uses functional composition with pure functions and clear input/output contracts.
 */

const { transformObject } = require('../shared').utils;
const { getCategoryIds, getProductFields } = require('./data');

/**
 * Transforms a media gallery entry into a simplified image object.
 * @param {Object} img - Media gallery entry from Adobe Commerce
 * @param {string} img.file - Image file path
 * @param {number} img.position - Image position/order
 * @param {Array<string>} [img.types] - Image type/role identifiers
 * @param {string} [img.url] - Direct URL to image
 * @returns {Object} Simplified image object
 */
function transformImageEntry(img) {
  if (!img || typeof img !== 'object') {
    return null;
  }

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
    position: img.position || 0,
  };

  if (img.types && Array.isArray(img.types) && img.types.length > 0) {
    imageObj.roles = img.types;
  }

  return imageObj;
}

/**
 * Gets the primary image URL from a product's images array
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
 * Transforms media gallery entries into simplified image objects
 * @param {Array<Object>} mediaGallery - Array of media gallery entries
 * @returns {Array<Object>} Array of transformed image objects
 */
function transformImages(mediaGallery) {
  if (!Array.isArray(mediaGallery)) {
    return [];
  }

  return mediaGallery
    .map(transformImageEntry)
    .filter(Boolean) // Remove any null entries
    .sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort by position
}

/**
 * Builds a product object with all fields.
 * @param {Object} product - The product object from Adobe Commerce
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Object} Transformed product object
 */
function buildProductObject(product, categoryMap, params = {}) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  const PRODUCT_FIELDS = getProductFields(params);

  const fieldMappings = {
    sku: () => product.sku || '',
    name: () => product.name || '',
    price: () => parseFloat(product.price) || 0,
    qty: () => parseInt(product.qty, 10) || 0,
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
    images: () => transformImages(product.media_gallery_entries),
    type_id: () => product.type_id || '',
    status: () => product.status || 0,
    visibility: () => product.visibility || 1,
    weight: () => parseFloat(product.weight) || 0,
    created_at: () => product.created_at || '',
    updated_at: () => product.updated_at || '',
    is_in_stock: () => Boolean(product.is_in_stock),
    description: () => product.description || '',
    short_description: () => product.short_description || '',
    url: () => product.url || '',
    url_key: () => product.url_key || '',
  };

  const result = transformObject(product, fieldMappings, PRODUCT_FIELDS);

  // Add performance metrics
  result.performance = {
    productCount: 1,
    categoryCount: result.categories ? result.categories.length : 0,
    imageCount: result.images ? result.images.length : 0,
  };

  return result;
}

/**
 * Maps a product object to a CSV row for RECS compatibility
 * @param {Object} product - Product object
 * @returns {Object} CSV row object with RECS headers
 */
function mapProductToCsvRow(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  return {
    sku: product.sku || '',
    name: product.name || '',
    category_id: Array.isArray(product.categories)
      ? typeof product.categories[0] === 'string'
        ? product.categories[0]
        : product.categories[0] && product.categories[0].name
          ? product.categories[0].name
          : ''
      : '',
    message: product.description || product.short_description || '',
    thumbnail_url: getPrimaryImageUrl(product.images),
    value: parseFloat(product.price) || 0,
    page_url: product.url || '',
    inventory: parseInt(product.qty, 10) || 0,
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

/**
 * Transforms multiple products into objects with all fields
 * @param {Array<Object>} products - Array of products from Adobe Commerce
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Array<Object>} Array of transformed product objects
 */
function buildProducts(products, categoryMap, params = {}) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product) => buildProductObject(product, categoryMap, params))
    .filter((product) => product.sku); // Filter out invalid products
}

/**
 * Transforms products array into CSV rows
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<Object>} Array of CSV row objects
 */
function mapProductsToCsvRows(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(mapProductToCsvRow).filter((row) => row.sku); // Filter out invalid rows
}

/**
 * Extracts and normalizes custom attributes from a product
 * @param {Object} product - Product object with custom_attributes
 * @returns {Object} Object with custom attributes as key-value pairs
 */
function extractCustomAttributes(product) {
  const customAttributes = {};

  if (!product || !Array.isArray(product.custom_attributes)) {
    return customAttributes;
  }

  product.custom_attributes.forEach((attr) => {
    if (attr && attr.attribute_code) {
      customAttributes[attr.attribute_code] = attr.value;
    }
  });

  return customAttributes;
}

/**
 * Transforms a product with custom attributes into a flattened structure
 * @param {Object} product - Product object
 * @returns {Object} Product with custom attributes flattened
 */
function flattenProductAttributes(product) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  const customAttributes = extractCustomAttributes(product);

  // Create a copy without custom_attributes array
  const flattenedProduct = { ...product };
  delete flattenedProduct.custom_attributes;

  // Merge custom attributes into the main product object
  return {
    ...flattenedProduct,
    ...customAttributes,
  };
}

/**
 * Validates and normalizes image data
 * @param {Object} image - Image object to validate
 * @returns {Object|null} Normalized image object or null if invalid
 */
function validateImage(image) {
  if (!image || typeof image !== 'object') {
    return null;
  }

  // Must have either file or url
  if (!image.file && !image.url) {
    return null;
  }

  return {
    filename: image.file || '',
    url: image.url || image.file || '',
    position: parseInt(image.position, 10) || 0,
    roles: Array.isArray(image.types) ? image.types : [],
  };
}

/**
 * Filters and validates images for a product
 * @param {Array<Object>} images - Array of image objects
 * @returns {Array<Object>} Array of valid, normalized image objects
 */
function validateImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map(validateImage)
    .filter(Boolean)
    .sort((a, b) => a.position - b.position);
}

/**
 * Calculates product metrics for reporting
 * @param {Object} product - Product object
 * @returns {Object} Product metrics
 */
function calculateProductMetrics(product) {
  if (!product || typeof product !== 'object') {
    return {
      hasImages: false,
      hasCategories: false,
      hasInventory: false,
      imageCount: 0,
      categoryCount: 0,
    };
  }

  return {
    hasImages: Array.isArray(product.images) && product.images.length > 0,
    hasCategories: Array.isArray(product.categories) && product.categories.length > 0,
    hasInventory: typeof product.qty === 'number' && product.qty > 0,
    imageCount: Array.isArray(product.images) ? product.images.length : 0,
    categoryCount: Array.isArray(product.categories) ? product.categories.length : 0,
  };
}

module.exports = {
  transformImageEntry,
  getPrimaryImageUrl,
  transformImages,
  buildProductObject,
  mapProductToCsvRow,
  buildProducts,
  mapProductsToCsvRows,
  extractCustomAttributes,
  flattenProductAttributes,
  validateImage,
  validateImages,
  calculateProductMetrics,
};
