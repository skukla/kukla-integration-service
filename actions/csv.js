/**
 * Simplified CSV Generation for Adobe App Builder
 * Direct CSV creation without over-engineered streaming abstractions
 */

// RECS header rows that must appear before the data
const RECS_HEADERS = [
  '## RECSRecommendations Upload File',
  "## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
  '## RECS',
  '## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.',
  "## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.",
  "## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.",
];

// CSV header definitions for product export
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
 * Map product object to CSV row format
 * Contains the core business logic for RECS format transformation
 */
function mapProductToCsvRow(product) {
  return CSV_HEADERS.reduce((mapped, header) => {
    mapped[header.id] = product[header.id] || '';
    return mapped;
  }, {});
}

/**
 * Create CSV content from products array
 * Simplified - no streaming, no compression, no fallback complexity
 *
 * @param {Array} products - Array of product objects
 * @returns {Object} CSV result with content and stats
 */
function createCsv(products) {
  // Create CSV header row
  const headers = CSV_HEADERS.map((h) => h.title).join(',');

  // Create CSV data rows
  const rows = products.map((product) => {
    const mapped = mapProductToCsvRow(product);
    return CSV_HEADERS.map((h) => {
      const value = mapped[h.id] || '';
      // Simple CSV escaping - wrap in quotes if contains comma
      return value.toString().includes(',') ? `"${value}"` : value;
    }).join(',');
  });

  // Combine RECS headers + CSV headers + data rows
  const csvContent = [...RECS_HEADERS, headers, ...rows].join('\n');

  return {
    content: csvContent,
    stats: {
      originalSize: csvContent.length,
      compressedSize: csvContent.length,
      savingsPercent: 0,
      rowCount: products.length,
    },
  };
}

module.exports = {
  createCsv,
  mapProductToCsvRow,
  RECS_HEADERS,
  CSV_HEADERS,
};
