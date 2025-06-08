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
  { id: 'sku', title: 'entity.id' },
  { id: 'name', title: 'entity.name' },
  { id: 'categories', title: 'entity.category' },
  { id: 'price', title: 'entity.value' },
  { id: 'qty', title: 'entity.inventory' },
  { id: 'base_image', title: 'entity.base_image' },
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
