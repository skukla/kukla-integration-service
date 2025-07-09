/**
 * Main Configuration Domain
 * @module config/domains/main
 *
 * 🎯 SHARED BUSINESS CONFIGURATION
 *
 * Contains only the core business settings that are truly shared across domains.
 * Each domain handles its own technical configuration.
 *
 * ⚙️ Shared business settings: Product catalog, export configuration, storage choice
 */

/**
 * Build main shared configuration
 * @returns {Object} Main configuration
 */
function buildMainConfig() {
  return {
    expectedProductCount: 119, // Expected catalog size (used by testing)
    csvFilename: 'products.csv', // Default export filename (used by files)

    // Default export fields
    exportFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],

    storage: {
      provider: 's3', // Storage provider choice: 's3' or 'app-builder'
      directory: 'public/', // Directory for file organization (used by both providers)
    },
  };
}

module.exports = {
  buildMainConfig,
};
