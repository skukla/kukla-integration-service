/**
 * Products Domain Configuration
 * @module config/domains/products
 *
 * Used by: Product Export processing, Commerce API integration
 * ⚙️ Key settings: Product fields, pagination, batch sizes, validation rules
 */

/**
 * CSV header definitions for RECS format
 */
const CSV_HEADERS = [
  { id: 'sku', title: '##RECSentity.id' },
  { id: 'name', title: 'entity.name' },
  { id: 'category_id', title: 'entity.categoryId' },
  { id: 'message', title: 'entity.message' },
  { id: 'thumbnail_url', title: 'entity.thumbnailUrl' },
  { id: 'value', title: 'entity.value' },
  { id: 'page_url', title: 'entity.pageUrl' },
  { id: 'inventory', title: 'entity.inventory' },
  { id: 'margin', title: 'entity.margin' },
  { id: 'type', title: 'entity.type' },
  { id: 'custom2', title: 'entity.custom2' },
  { id: 'custom3', title: 'entity.custom3' },
  { id: 'custom4', title: 'entity.custom4' },
  { id: 'custom5', title: 'entity.custom5' },
  { id: 'custom6', title: 'entity.custom6' },
  { id: 'custom7', title: 'entity.custom7' },
  { id: 'custom8', title: 'entity.custom8' },
  { id: 'custom9', title: 'entity.custom9' },
  { id: 'custom10', title: 'entity.custom10' },
];

/**
 * RECS header rows that must appear before the data
 * These headers indicate Adobe Recommendations pre-processing requirements
 */
const RECS_HEADERS = [
  '## RECS',
  "## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
  '## RECS',
];

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
      pageSize: 200,
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

    csv: {
      requiredFields: ['sku', 'name', 'category_id', 'message', 'thumbnail_url', 'value'],
      headers: CSV_HEADERS,
      recsHeaders: RECS_HEADERS,
    },
  };
}

module.exports = {
  buildProductsConfig,
};
