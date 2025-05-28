/**
 * Commerce data module entry point
 * @module commerce/data
 */

const product = require('./product');
const category = require('./category');
const inventory = require('./inventory');

module.exports = {
    // Product data
    product,
    
    // Category data
    category,
    
    // Inventory data
    inventory
}; 