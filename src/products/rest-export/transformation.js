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
    name: product.name || product.sku || '',
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
  // Use enriched inventory data (from separate API calls) instead of extension_attributes
  const inventory = product.inventory;
  const qty = inventory?.qty || 0;

  return {
    ...productObj,
    qty: qty,
    is_in_stock: inventory?.is_in_stock || false,
    stock_status: inventory?.is_in_stock ? 'In Stock' : 'Out of Stock',
    manage_stock: inventory?.manage_stock || false,
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
  // Use enriched categories first (from API with real names) - PREFERRED
  if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
    // Categories are already enriched with real names from Commerce API
    return {
      ...productObj,
      categories: product.categories, // Already has id, name, path, level, etc.
      category_string: buildCategoryString(product.categories),
      category_ids: product.categories.map((cat) => cat.id).join(','),
    };
  }

  // Fallback: Use raw category_links (only if enrichment failed)
  const categoryLinks = product.extension_attributes?.category_links || [];

  if (categoryLinks.length === 0) {
    return {
      ...productObj,
      categories: [],
      category_string: '',
      category_ids: '',
    };
  }

  // Create basic category objects from raw data (fallback only)
  const basicCategories = categoryLinks.map((link) => ({
    id: link.category_id,
    category_id: link.category_id,
    name: `Category ${link.category_id}`, // Generic fallback name
    position: link.position || 0,
  }));

  return {
    ...productObj,
    categories: basicCategories,
    category_string: buildCategoryString(basicCategories),
    category_ids: categoryLinks.map((link) => link.category_id).join(','),
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

  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
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

  // Add pricing fields first
  const pricingFields = buildProductPricing(product);
  productObj = { ...productObj, ...pricingFields };

  // Add inventory fields using extension_attributes data
  productObj = addInventoryFields(productObj, product);

  // Add category fields using extension_attributes data
  productObj = addCategoryFields(productObj, product);

  // Add image and custom attribute fields
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
 * @param {Array} categories - Array of category objects (from category_links or enriched categories)
 * @returns {string} Formatted category string for export
 * @usedBy Category field building requiring string representation
 */
function buildCategoryString(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  return categories
    .map((cat) => {
      // Handle category_links format: { category_id: "9" }
      if (cat.category_id) {
        return cat.category_id;
      }
      // Handle enriched category format: { name: "Category Name" }
      if (cat.name) {
        return cat.name;
      }
      // Fallback for string categories
      return cat;
    })
    .join(', ');
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
