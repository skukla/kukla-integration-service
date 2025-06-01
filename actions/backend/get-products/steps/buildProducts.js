/**
 * Step to build product objects with requested fields
 * @module steps/buildProducts
 */

const {
  transform: {
    product: { buildProductObject },
  },
} = require('../../../../src/commerce');

/**
 * Transforms raw product data into the required format
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @returns {Promise<Object[]>} Transformed product objects ready for CSV
 * @throws {Error} If product transformation fails
 */
async function buildProducts(products) {
  try {
    // Build category map from enriched products
    const categoryMap = {};
    products.forEach((product) => {
      if (product.categories) {
        product.categories.forEach((category) => {
          categoryMap[category.id] = category.name;
        });
      }
    });

    // Transform each product
    return products.map((product) => buildProductObject(product, categoryMap));
  } catch (error) {
    throw new Error(`Failed to build products: ${error.message}`);
  }
}

module.exports = buildProducts;
