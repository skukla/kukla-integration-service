/**
 * Products Category Utilities
 *
 * Low-level pure functions for category and SKU extraction.
 * Contains utilities for working with product categories and identifiers.
 */

/**
 * Extract unique category IDs from products
 * Pure function that extracts category IDs from product data.
 *
 * @param {Array} products - Array of product objects
 * @returns {Set} Set of unique category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  // Add type checking to prevent forEach errors
  if (!products || !Array.isArray(products)) {
    return categoryIds;
  }

  products.forEach((product) => {
    if (product.categories) {
      product.categories.forEach((cat) => {
        if (cat.id) categoryIds.add(cat.id);
      });
    }
    // Also check custom_attributes for category_ids
    if (product.custom_attributes) {
      const categoryAttr = product.custom_attributes.find(
        (attr) => attr.attribute_code === 'category_ids'
      );
      if (categoryAttr && categoryAttr.value) {
        // Handle different value types
        let catIds = [];
        if (typeof categoryAttr.value === 'string') {
          catIds = categoryAttr.value.split(',');
        } else if (Array.isArray(categoryAttr.value)) {
          catIds = categoryAttr.value.map(String);
        } else {
          catIds = [String(categoryAttr.value)];
        }
        catIds.forEach((id) => categoryIds.add(parseInt(String(id).trim())));
      }
    }
  });

  return categoryIds;
}

/**
 * Extract unique SKUs from products
 * Pure function that extracts SKUs for inventory lookup.
 *
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of unique SKUs
 */
function extractProductSkus(products) {
  const skus = [];

  products.forEach((product) => {
    if (product.sku && !skus.includes(product.sku)) {
      skus.push(product.sku);
    }
  });

  return skus;
}

/**
 * Validates category object structure
 * Pure function that checks if a category object has required properties.
 *
 * @param {Object} category - Category object to validate
 * @returns {boolean} True if category is valid
 */
function validateCategoryObject(category) {
  if (!category || typeof category !== 'object') {
    return false;
  }

  // Required: id and name
  if (!category.id || !category.name) {
    return false;
  }

  // ID should be numeric
  if (isNaN(parseInt(category.id))) {
    return false;
  }

  return true;
}

/**
 * Filters categories by parent ID
 * Pure function that returns categories with specific parent ID.
 *
 * @param {Array} categories - Array of category objects
 * @param {number|string} parentId - Parent ID to filter by
 * @returns {Array} Filtered categories array
 */
function filterCategoriesByParent(categories, parentId) {
  if (!Array.isArray(categories)) {
    return [];
  }

  const targetParentId = parseInt(parentId);
  if (isNaN(targetParentId)) {
    return [];
  }

  return categories.filter((category) => {
    const categoryParentId = parseInt(category.parent_id);
    return !isNaN(categoryParentId) && categoryParentId === targetParentId;
  });
}

/**
 * Builds category hierarchy from flat list
 * Pure function that creates nested category structure.
 *
 * @param {Array} categories - Array of flat category objects
 * @param {number} [rootParentId=1] - ID of root parent category
 * @returns {Array} Hierarchical category tree
 */
function buildCategoryHierarchy(categories, rootParentId = 1) {
  if (!Array.isArray(categories)) {
    return [];
  }

  const categoryMap = {};
  const rootCategories = [];

  // First pass: create category map
  categories.forEach((category) => {
    if (validateCategoryObject(category)) {
      categoryMap[category.id] = {
        ...category,
        children: [],
      };
    }
  });

  // Second pass: build hierarchy
  categories.forEach((category) => {
    if (!validateCategoryObject(category)) {
      return;
    }

    const categoryNode = categoryMap[category.id];
    const parentId = parseInt(category.parent_id);

    if (parentId === rootParentId || isNaN(parentId)) {
      rootCategories.push(categoryNode);
    } else if (categoryMap[parentId]) {
      categoryMap[parentId].children.push(categoryNode);
    }
  });

  return rootCategories;
}

/**
 * Flattens category hierarchy to flat list
 * Pure function that converts nested categories to flat array.
 *
 * @param {Array} categoryTree - Hierarchical category structure
 * @returns {Array} Flat array of categories
 */
function flattenCategoryHierarchy(categoryTree) {
  if (!Array.isArray(categoryTree)) {
    return [];
  }

  const flattened = [];

  function flatten(categories) {
    categories.forEach((category) => {
      const { children, ...categoryData } = category;
      flattened.push(categoryData);

      if (children && children.length > 0) {
        flatten(children);
      }
    });
  }

  flatten(categoryTree);
  return flattened;
}

/**
 * Gets category path from root to category
 * Pure function that builds category breadcrumb path.
 *
 * @param {Object} targetCategory - Category to find path for
 * @param {Array} allCategories - Complete list of categories
 * @returns {Array} Array of categories from root to target
 */
function getCategoryPath(targetCategory, allCategories) {
  if (!targetCategory || !Array.isArray(allCategories)) {
    return [];
  }

  const categoryMap = {};
  allCategories.forEach((cat) => {
    if (validateCategoryObject(cat)) {
      categoryMap[cat.id] = cat;
    }
  });

  const path = [];
  let current = targetCategory;

  while (current) {
    path.unshift(current);
    const parentId = parseInt(current.parent_id);
    current = !isNaN(parentId) ? categoryMap[parentId] : null;
  }

  return path;
}

module.exports = {
  extractCategoryIds,
  extractProductSkus,
  validateCategoryObject,
  filterCategoriesByParent,
  buildCategoryHierarchy,
  flattenCategoryHierarchy,
  getCategoryPath,
};
