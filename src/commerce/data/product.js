/**
 * Product data handling and validation
 * @module commerce/data/product
 */

const { data: { validateInput } } = require('../../core');

/**
 * Product field definitions
 * @constant {Object}
 */
const PRODUCT_FIELDS = {
    REQUIRED: ['sku', 'name', 'price'],
    OPTIONAL: ['qty', 'categories', 'images'],
    ALL: ['sku', 'name', 'price', 'qty', 'categories', 'images']
};

/**
 * Product field validation rules
 * @constant {Object}
 */
const PRODUCT_VALIDATION = {
    sku: {
        type: 'string',
        required: true,
        pattern: /^[A-Za-z0-9\-\_]+$/,
        message: 'SKU must contain only letters, numbers, hyphens, and underscores'
    },
    name: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        message: 'Name must be between 1 and 255 characters'
    },
    price: {
        type: 'number',
        required: true,
        min: 0,
        message: 'Price must be a positive number'
    },
    qty: {
        type: 'number',
        required: false,
        min: 0,
        default: 0,
        message: 'Quantity must be a non-negative number'
    },
    categories: {
        type: 'array',
        required: false,
        default: [],
        message: 'Categories must be an array of strings'
    },
    images: {
        type: 'array',
        required: false,
        default: [],
        message: 'Images must be an array of image objects'
    }
};

/**
 * Validates product data against schema
 * @param {Object} product - Product data to validate
 * @param {Array<string>} [fields] - Specific fields to validate
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<string>} errors - Array of error messages
 */
function validateProduct(product, fields = PRODUCT_FIELDS.REQUIRED) {
    return validateInput(product, fields.reduce((rules, field) => {
        if (PRODUCT_VALIDATION[field]) {
            rules[field] = PRODUCT_VALIDATION[field];
        }
        return rules;
    }, {}));
}

/**
 * Gets the list of fields to include in the response
 * @param {Object} params - Request parameters
 * @param {Array<string>} [params.fields] - Optional array of field names to include
 * @returns {Array<string>} Array of field names to include
 */
function getRequestedFields(params) {
    if (!Array.isArray(params.fields) || params.fields.length === 0) {
        return PRODUCT_FIELDS.ALL;
    }
    
    // Validate that all requested fields are available
    const invalidFields = params.fields.filter(field => !PRODUCT_FIELDS.ALL.includes(field));
    if (invalidFields.length > 0) {
        throw new Error(`Invalid fields requested: ${invalidFields.join(', ')}. Available fields are: ${PRODUCT_FIELDS.ALL.join(', ')}`);
    }
    
    return params.fields;
}

module.exports = {
    PRODUCT_FIELDS,
    PRODUCT_VALIDATION,
    validateProduct,
    getRequestedFields
}; 