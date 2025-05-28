/**
 * Inventory data handling and validation
 * @module commerce/data/inventory
 */

const { data: { validateInput } } = require('../../core');

/**
 * Inventory field definitions
 * @constant {Object}
 */
const INVENTORY_FIELDS = {
    REQUIRED: ['sku', 'qty'],
    OPTIONAL: ['is_in_stock', 'manage_stock'],
    ALL: ['sku', 'qty', 'is_in_stock', 'manage_stock']
};

/**
 * Inventory field validation rules
 * @constant {Object}
 */
const INVENTORY_VALIDATION = {
    sku: {
        type: 'string',
        required: true,
        message: 'SKU is required'
    },
    qty: {
        type: 'number',
        required: true,
        min: 0,
        message: 'Quantity must be a non-negative number'
    },
    is_in_stock: {
        type: 'boolean',
        required: false,
        default: false,
        message: 'In stock status must be a boolean'
    },
    manage_stock: {
        type: 'boolean',
        required: false,
        default: true,
        message: 'Manage stock must be a boolean'
    }
};

/**
 * Validates inventory data against schema
 * @param {Object} inventory - Inventory data to validate
 * @param {Array<string>} [fields] - Specific fields to validate
 * @returns {Object} Validation result
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<string>} errors - Array of error messages
 */
function validateInventory(inventory, fields = INVENTORY_FIELDS.REQUIRED) {
    return validateInput(inventory, fields.reduce((rules, field) => {
        if (INVENTORY_VALIDATION[field]) {
            rules[field] = INVENTORY_VALIDATION[field];
        }
        return rules;
    }, {}));
}

/**
 * Calculates total quantity from multiple stock items
 * @param {Array<Object>} stockItems - Array of stock items
 * @returns {Object} Combined inventory data
 */
function calculateTotalInventory(stockItems) {
    if (!Array.isArray(stockItems) || stockItems.length === 0) {
        return {
            qty: 0,
            is_in_stock: false
        };
    }

    return stockItems.reduce((total, item) => ({
        qty: total.qty + (item.quantity || 0),
        is_in_stock: total.is_in_stock || (item.status === 1)
    }), { qty: 0, is_in_stock: false });
}

module.exports = {
    INVENTORY_FIELDS,
    INVENTORY_VALIDATION,
    validateInventory,
    calculateTotalInventory
}; 