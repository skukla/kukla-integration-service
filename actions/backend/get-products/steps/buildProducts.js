/**
 * Step to build product objects with requested fields
 * @module steps/buildProducts
 */

const { buildProductObject, getRequestedFields } = require('../lib/product-transformer');

/**
 * Transforms raw product data into the required format
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @param {string[]} [fields] - Optional list of specific fields to include
 * @returns {Promise<Object[]>} Transformed product objects ready for CSV
 * @throws {Error} If product transformation fails
 */
async function buildProducts(products, fields) {
  try {
    // Get the list of fields to include (either specified or default)
    const requestedFields = fields || getRequestedFields();

    // Transform each product with the requested fields
    return products.map(product => buildProductObject(product, requestedFields));
  } catch (error) {
    throw new Error(`Failed to build products: ${error.message}`);
  }
}

module.exports = buildProducts; 