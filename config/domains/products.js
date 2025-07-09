/**
 * Products Domain Configuration
 * @module config/domains/products
 *
 * 🎯 Used by: Product Export processing, Commerce API integration
 * ⚙️ Key settings: Product processing fields, validation rules, technical batch settings
 *
 * 📋 Shared settings: Uses main configuration for pagination (pageSize, maxPages)
 */

/**
 * Build products configuration
 * @param {Object} [params] - Action parameters (unused - kept for interface consistency)
 * @param {Object} [mainConfig] - Shared main configuration
 * @returns {Object} Products configuration
 */
function buildProductsConfig(params = {}, mainConfig = {}) {
  // Note: params parameter kept for consistent interface but not used
  // eslint-disable-next-line no-unused-vars
  params;

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

    // 🔗 SHARED: Pagination settings from main configuration
    pagination: {
      pageSize: mainConfig.batching?.productPageSize || 100, // Shared from main
      maxPages: mainConfig.batching?.maxPages || 25, // Shared from main
      fallbackPageSize: 50, // Technical: fallback for error conditions
    },

    // 🔧 TECHNICAL: Product-specific batch settings
    batching: {
      size: 50, // Technical: general batch size
      concurrency: {
        default: 100, // Technical: default batch processing concurrency
        monitoring: 100, // Technical: for batch monitoring operations
      },
    },

    // 🔧 TECHNICAL: Product validation rules
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
