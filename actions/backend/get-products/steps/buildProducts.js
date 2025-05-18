/**
 * Step to build product objects with requested fields
 * @module steps/buildProducts
 */

const { buildProductObject } = require('../lib/product-transformer');

/**
 * Builds an array of product objects with only the requested fields.
 * @param {Object[]} products - Array of product objects from Adobe Commerce
 * @param {Array<string>} requestedFields - Fields to include in the output
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @returns {Object[]} Array of filtered product objects
 */
module.exports = function buildProducts(products, requestedFields, categoryMap) {
  return products.map(product => buildProductObject(product, requestedFields, categoryMap));
}; 