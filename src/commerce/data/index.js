/**
 * Commerce data module entry point
 * @module commerce/data
 */

const category = require('./category');
const inventory = require('./inventory');
const product = require('./product');

module.exports = {
  // Product data
  product,

  // Category data
  category,

  // Inventory data
  inventory,
};
