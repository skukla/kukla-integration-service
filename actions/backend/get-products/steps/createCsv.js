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
 * RECS header rows that must appear before the data
 * @constant {Array<string>}
 */
const RECS_HEADERS = [
  '## RECSRecommendations Upload File',
  "## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
  '## RECS',
  '## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.',
  "## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.",
  "## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.",
];

/**
 * CSV header definitions for product export
 * @constant {Array<Object>}
 */
const CSV_HEADERS = [
  { id: 'sku', title: '##RECSentity.id' },
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

    // Add RECS headers before the CSV content
    const csvContent = RECS_HEADERS.join('\n') + '\n' + result.content.toString();

    return {
      content: csvContent,
      stats: {
        originalSize: csvContent.length,
        compressedSize: csvContent.length,
        savingsPercent: 0,
      },
    };
  } catch (error) {
    // Fallback to simple CSV generation if core module fails
    // Note: This should use proper logger when available from action context

    const headers = CSV_HEADERS.map((h) => h.title).join(',');
    const rows = products.map((product) => {
      const mapped = mapProductToCsvRow(product);
      return CSV_HEADERS.map((h) => mapped[h.id] || '').join(',');
    });

    // Add RECS headers and CSV content
    const csvContent = [...RECS_HEADERS, headers, ...rows].join('\n');

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
