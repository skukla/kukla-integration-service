/**
 * Products Transformation Operations
 *
 * Mid-level business logic for product transformation and data standardization.
 * Contains the core business rules for converting raw Commerce data into
 * standardized product objects.
 */

const {
  getCategoryIds,
  extractCsvCategoryId,
  extractProductMessage,
  normalizeProductValue,
  normalizeProductInventory,
} = require('../utils/data');
const { transformImageEntry, getPrimaryImageUrl } = require('../utils/image');

/**
 * Default product fields (fallback for compatibility)
 * @constant {Array<string>}
 */
const DEFAULT_PRODUCT_FIELDS = ['sku', 'name', 'price', 'qty', 'categories', 'images'];

/**
 * Builds a standardized product object with all required fields
 * Pure function that transforms raw product data into standardized format.
 *
 * @param {Object} product - Raw product data from Adobe Commerce
 * @param {Object} categoryMap - Map of category IDs to names
 * @param {Object} config - Configuration object (optional)
 * @returns {Object} Standardized product object
 */
function buildProductObject(product, categoryMap = {}, config = {}) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  // Get product fields from main config (determines final CSV output fields)
  const productFields = config.main?.exportFields || DEFAULT_PRODUCT_FIELDS;

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
    images: () => (product.media_gallery_entries || []).map(transformImageEntry),
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

  // Build result with only requested fields
  const result = {};
  productFields.forEach((field) => {
    if (fieldMappings[field]) {
      result[field] = fieldMappings[field]();
    } else {
      // Fallback for unknown fields
      result[field] = product[field] || '';
    }
  });

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
 * Pure function that converts product data to CSV row format.
 *
 * @param {Object} product - Product object
 * @returns {Object} CSV row object with RECS headers
 */
function mapProductToCsvRow(product) {
  if (!product || typeof product !== 'object') {
    return {
      sku: '',
      name: '',
      category_id: '',
      message: '',
      thumbnail_url: '',
      value: '',
      page_url: '',
      inventory: '',
      margin: '',
      type: '',
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

  return {
    sku: product.sku || '',
    name: product.name || '',
    category_id: extractCsvCategoryId(product.categories),
    message: extractProductMessage(product),
    thumbnail_url: getPrimaryImageUrl(product.images),
    value: normalizeProductValue(product.price),
    page_url: product.url || '',
    inventory: normalizeProductInventory(product.qty),
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
 * Transforms raw product data into the required format
 * Pure function that processes an array of products through standardization.
 *
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @param {Object} config - Configuration object (optional, for compatibility)
 * @returns {Promise<Object[]>} Transformed product objects ready for CSV
 * @throws {Error} If product transformation fails
 */
async function buildProducts(products, config = {}) {
  if (!Array.isArray(products)) {
    return [];
  }

  try {
    // Build category map from enriched products
    const categoryMap = {};
    products.forEach((product) => {
      if (product.categories) {
        product.categories.forEach((category) => {
          categoryMap[category.id] = category.name;
        });
      }
    });

    // Transform each product using the robust implementation
    return products
      .map((product) => buildProductObject(product, categoryMap, config))
      .filter((product) => product.sku); // Filter out invalid products
  } catch (error) {
    throw new Error(`Failed to build products: ${error.message}`);
  }
}

module.exports = {
  buildProductObject,
  mapProductToCsvRow,
  buildProducts,
  DEFAULT_PRODUCT_FIELDS,
};
