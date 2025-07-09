/**
 * Products Domain Configuration
 * @module config/domains/products
 *
 * 🎯 Used by: Product Export processing
 * ⚙️ Key settings: Batch sizes for data processing
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
