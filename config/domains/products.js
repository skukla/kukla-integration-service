/**
 * Products Domain Configuration
 * @module config/domains/products
 */

/**
 * Build products configuration
 * @returns {Object} Products configuration
 */
function buildProductsConfig() {
  return {
    batchSize: 50,
  };
}

module.exports = {
  buildProductsConfig,
};
