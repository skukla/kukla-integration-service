/**
 * Products Domain Configuration
 * @module config/domains/products
 *
 * 🎯 Used by: Product Export processing, Commerce API integration
 * ⚙️ Key settings: Product fields, pagination, batch sizes, validation rules
 */

/**
 * Build products configuration
 * @returns {Object} Products configuration
 */
function buildProductsConfig() {
  return {
    fields: {
      // Complete field set for export operations (advanced users)
      export: [
        'id',
        'sku',
        'name',
        'price',
        'status',
        'type_id',
        'attribute_set_id',
        'created_at',
        'updated_at',
        'weight',
        'categories',
        'media_gallery_entries',
        'custom_attributes',
      ],
      // Essential fields for processing operations
      processing: [
        'sku',
        'name',
        'status',
        'price',
        'category_links',
        'custom_attributes',
        'media_gallery_entries',
      ],
    },

    pagination: {
      pageSize: 100, // Standard page size for Commerce API
      maxPages: 25, // Maximum pages to process
      fallbackPageSize: 50, // Fallback for error conditions
    },

    batching: {
      size: 50, // General batch size
      concurrency: {
        default: 100, // Default batch processing concurrency
        monitoring: 100, // For batch monitoring operations
      },
    },

    validation: {
      batchSize: {
        min: 1,
        max: 200,
      },
    },
  };
}

module.exports = {
  buildProductsConfig,
};
