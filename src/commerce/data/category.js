/**
 * Category data handling and validation
 * @module commerce/data/category
 */

const {
  data: { validateInput },
} = require('../../core');

/**
 * Category field definitions
 * @constant {Object}
 */
const CATEGORY_FIELDS = {
  REQUIRED: ['id', 'name'],
  OPTIONAL: ['path', 'level', 'parent_id', 'children'],
  ALL: ['id', 'name', 'path', 'level', 'parent_id', 'children'],
};

/**
 * Category field validation rules
 * @constant {Object}
 */
const CATEGORY_VALIDATION = {
  id: {
    type: 'string',
    required: true,
    message: 'Category ID is required',
  },
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 255,
    message: 'Name must be between 1 and 255 characters',
  },
  path: {
    type: 'string',
    required: false,
    message: 'Path must be a string',
  },
  level: {
    type: 'number',
    required: false,
    min: 0,
    message: 'Level must be a non-negative number',
  },
  parent_id: {
    type: 'string',
    required: false,
    message: 'Parent ID must be a string',
  },
  children: {
    type: 'array',
    required: false,
    default: [],
    message: 'Children must be an array of category IDs',
  },
};

/**
 * Extract category IDs from a product
 * @param {Object} product - Product object
 * @returns {string[]} Array of category IDs
 */
function getCategoryIds(product) {
  const categoryIds = new Set();

  // Check category_ids array
  if (Array.isArray(product.category_ids)) {
    product.category_ids.forEach((id) => categoryIds.add(String(id)));
  }

  // Check extension_attributes.category_links
  if (Array.isArray(product.extension_attributes?.category_links)) {
    product.extension_attributes.category_links.forEach((link) => {
      if (link.category_id) {
        categoryIds.add(String(link.category_id));
      }
    });
  }

  return Array.from(categoryIds);
}

/**
 * Validates category data against schema
 * @param {Object} category - Category data to validate
 * @param {Array<string>} [fields] - Specific fields to validate
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<string>} errors - Array of error messages
 */
function validateCategory(category, fields = CATEGORY_FIELDS.REQUIRED) {
  return validateInput(
    category,
    fields.reduce((rules, field) => {
      if (CATEGORY_VALIDATION[field]) {
        rules[field] = CATEGORY_VALIDATION[field];
      }
      return rules;
    }, {})
  );
}

module.exports = {
  CATEGORY_FIELDS,
  CATEGORY_VALIDATION,
  getCategoryIds,
  validateCategory,
};
