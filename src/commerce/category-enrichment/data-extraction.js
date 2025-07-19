/**
 * Category Enrichment - Data Extraction Sub-module
 * All category ID extraction and product enhancement utilities
 */

// Data Extraction Workflows

/**
 * Apply category data to products with comprehensive mapping
 * @purpose Map fetched category data to products with support for different category storage formats
 * @param {Array} products - Array of product objects to enhance with category information
 * @param {Object} categoryMap - Map of category ID to complete category data
 * @returns {Array} Array of products enhanced with complete category information
 * @usedBy enrichProductsWithCategoriesAndFallback
 */
async function applyCategoriesToProducts(products, categoryMap) {
  return products.map((product) => {
    const categoryIds = getCategoryIdsFromProduct(product);
    const categoryObjects = categoryIds.map((id) => categoryMap[String(id)]).filter(Boolean);

    return {
      ...product,
      categories: categoryObjects,
      // Preserve original category structure for compatibility
      enrichedCategories: categoryObjects.map((cat) => ({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        path: cat.path,
      })),
    };
  });
}

// Data Extraction Utilities

/**
 * Extract unique category IDs from all products
 * @purpose Extract all unique category IDs from product array for efficient batch fetching
 * @param {Array} products - Array of product objects
 * @returns {Set} Set of unique category IDs
 * @usedBy enrichProductsWithCategoriesAndFallback
 */
function extractUniqueCategoryIds(products) {
  const categoryIds = new Set();

  if (!Array.isArray(products)) {
    return categoryIds;
  }

  products.forEach((product) => {
    const productCategoryIds = getCategoryIdsFromProduct(product);
    productCategoryIds.forEach((id) => categoryIds.add(String(id)));
  });

  return categoryIds;
}

/**
 * Get category IDs from a single product
 * @purpose Extract category IDs from product with support for multiple Commerce API formats
 * @param {Object} product - Product object
 * @returns {Array} Array of category IDs for the product
 * @usedBy extractUniqueCategoryIds, applyCategoriesToProducts
 */
function getCategoryIdsFromProduct(product) {
  const categoryIds = [];

  if (!product || typeof product !== 'object') {
    return categoryIds;
  }

  // Extract from different sources
  extractFromDirectCategories(product, categoryIds);
  extractFromExtensionAttributes(product, categoryIds);
  extractFromCustomAttributes(product, categoryIds);

  return categoryIds;
}

/**
 * Extract category IDs from direct categories array
 * @param {Object} product - Product object
 * @param {Array} categoryIds - Array to push category IDs to
 */
function extractFromDirectCategories(product, categoryIds) {
  if (product.categories && Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      if (cat.id) {
        categoryIds.push(cat.id);
      }
    });
  }
}

/**
 * Extract category IDs from extension attributes
 * @param {Object} product - Product object
 * @param {Array} categoryIds - Array to push category IDs to
 */
function extractFromExtensionAttributes(product, categoryIds) {
  if (product.extension_attributes && product.extension_attributes.category_links) {
    product.extension_attributes.category_links.forEach((link) => {
      if (link.category_id) {
        categoryIds.push(link.category_id);
      }
    });
  }
}

/**
 * Extract category IDs from custom attributes
 * @param {Object} product - Product object
 * @param {Array} categoryIds - Array to push category IDs to
 */
function extractFromCustomAttributes(product, categoryIds) {
  if (!product.custom_attributes || !Array.isArray(product.custom_attributes)) {
    return;
  }

  const categoryAttr = product.custom_attributes.find(
    (attr) => attr.attribute_code === 'category_ids'
  );

  if (!categoryAttr || !categoryAttr.value) {
    return;
  }

  const catIds = normalizeAttributeValue(categoryAttr.value);
  addValidCategoryIds(catIds, categoryIds);
}

/**
 * Normalize attribute value to array of strings
 * @param {*} value - Attribute value in various formats
 * @returns {Array} Array of string values
 */
function normalizeAttributeValue(value) {
  if (typeof value === 'string') {
    return value.split(',');
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

/**
 * Add valid category IDs to the collection
 * @param {Array} catIds - Array of potential category ID strings
 * @param {Array} categoryIds - Target array for valid category IDs
 */
function addValidCategoryIds(catIds, categoryIds) {
  catIds.forEach((id) => {
    const categoryId = parseInt(String(id).trim());
    if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
      categoryIds.push(categoryId);
    }
  });
}

module.exports = {
  // Workflows
  applyCategoriesToProducts,

  // Utilities
  extractUniqueCategoryIds,
  getCategoryIdsFromProduct,
};
