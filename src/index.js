/**
 * Main Catalog - Single Entry Point for All Functionality
 *
 * This catalog provides discoverable access to all domain functionality
 * following the Discoverability First principle from our refactoring standards.
 *
 * Usage:
 *   const { products, files, commerce, shared } = require('./src');
 *
 *   // Domain-organized access
 *   const productData = await products.fetchProducts(config);
 *   const storageResult = await files.storeFile(csvData, config);
 */

module.exports = {
  products: require('./products'),
  files: require('./files'),
  commerce: require('./commerce'),
  shared: require('./shared'),
};
