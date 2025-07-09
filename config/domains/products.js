/**
 * Products Domain Configuration
 * @module config/domains/products
 *
 * 🎯 Used by: Product Export processing
 * ⚙️ Key settings: Batch sizes, validation rules, field processing
 */

/**
 * Build products configuration
 * @returns {Object} Products configuration
 */
function buildProductsConfig() {
  return {
    batchSize: 50,
    pagination: {
      defaultPageSize: 100,
      fallbackPageSize: 50,
    },
    validation: {
      batchSize: {
        min: 1,
        max: 200,
      },
    },
    processing: {
      defaultFieldSelection: [
        'sku',
        'name',
        'status',
        'price',
        'category_links',
        'custom_attributes',
        'media_gallery_entries',
      ],
      concurrency: {
        default: 100, // Default batch processing concurrency
        monitoring: 100, // For batch monitoring operations
      },
    },
  };
}

module.exports = {
  buildProductsConfig,
};
