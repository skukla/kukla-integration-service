/**
 * Products Shared Data Utilities
 * Utilities shared across 3+ features in the products domain
 */

/**
 * Extract unique category IDs from products
 * @purpose Extract all unique category IDs from an array of products for batch fetching
 * @param {Array} products - Array of product objects
 * @returns {Set} Set of unique category IDs
 * @usedBy enrichProductsWithCategories in product-enrichment.js, rest-export, mesh-export
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  if (!Array.isArray(products)) {
    return categoryIds;
  }

  products.forEach((product) => {
    if (product.category_links && Array.isArray(product.category_links)) {
      product.category_links.forEach((link) => {
        if (link.category_id) {
          categoryIds.add(String(link.category_id));
        }
      });
    }

    // Handle direct categories array
    if (product.categories && Array.isArray(product.categories)) {
      product.categories.forEach((category) => {
        if (category.id) {
          categoryIds.add(String(category.id));
        }
      });
    }
  });

  return categoryIds;
}

/**
 * Extract unique product SKUs from products
 * @purpose Extract all unique SKUs from an array of products for inventory batch fetching
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of unique SKUs
 * @usedBy enrichProductsWithInventory in product-enrichment.js, rest-export, mesh-export
 */
function extractProductSkus(products) {
  const skus = [];

  if (!Array.isArray(products)) {
    return skus;
  }

  products.forEach((product) => {
    if (product.sku && typeof product.sku === 'string') {
      skus.push(product.sku);
    }
  });

  // Return unique SKUs
  return [...new Set(skus)];
}

/**
 * Extract product message/description content
 * @purpose Extract product description/short_description from various Commerce API formats
 * @param {Object} product - Product object
 * @param {string} field - Field name ('description' or 'short_description')
 * @returns {string} Extracted message content
 * @usedBy rest-export, mesh-export, operations/transformation (3+ features)
 */
function extractProductMessage(product, field = 'description') {
  if (!product || typeof product !== 'object') {
    return '';
  }

  // Direct field access
  if (product[field]) {
    return String(product[field]);
  }

  // Check custom_attributes
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    const attr = product.custom_attributes.find((attr) => attr.attribute_code === field);
    if (attr && attr.value) {
      return String(attr.value);
    }
  }

  return '';
}

module.exports = {
  extractCategoryIds,
  extractProductSkus,
  extractProductMessage,
};
