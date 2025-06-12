/**
 * CSV generation step for product export
 * @module steps/createCsv
 */

const {
  transform: {
    product: { mapProductToCsvRow },
  },
} = require('../../../../src/commerce');
const {
  storage: { csv },
} = require('../../../../src/core');

/**
 * CSV header definitions for product export
 * @constant {Array<Object>}
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
 * Generates a CSV file from product data
 * @param {Array<Object>} products - Array of transformed product objects
 * @returns {Promise<{content: string, stats: Object}>} Generated CSV content and stats
 */
async function createCsv(products) {
  try {
    // Use the core CSV generation without compression for now
    const result = await csv.generateCsv({
      records: products,
      headers: CSV_HEADERS,
      rowMapper: mapProductToCsvRow,
      compression: false, // Disable compression to avoid dependency issues
    });

    // Convert Buffer to string for compatibility
    return {
      content: result.content.toString(),
      stats: result.stats,
    };
  } catch (error) {
    // Fallback to simple CSV generation if core module fails
    // Note: This should use proper logger when available from action context

    const headers = CSV_HEADERS.map((h) => h.title).join(',');
    const rows = products.map((product) => {
      const mapped = mapProductToCsvRow(product);
      return CSV_HEADERS.map((h) => mapped[h.id] || '').join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    return {
      content: csvContent,
      stats: {
        originalSize: csvContent.length,
        compressedSize: csvContent.length,
        savingsPercent: 0,
      },
    };
  }
}

module.exports = createCsv;
