/**
 * Products CSV Utilities
 *
 * Low-level pure functions for CSV generation and formatting.
 * Contains RECS-specific CSV formatting and generation logic.
 */

const { generateCsv } = require('../../files');
const { mapProductToCsvRow } = require('../operations/transformation');

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
 * Creates a CSV file from product data
 * Pure function that generates CSV content from product objects.
 *
 * @param {Object[]} products - Array of product objects
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} CSV generation result
 * @throws {Error} If CSV generation fails
 */
async function createCsv(products, config) {
  try {
    // Try using the core CSV generation first
    try {
      const result = await generateCsv({
        records: products,
        headers: CSV_HEADERS,
        rowMapper: mapProductToCsvRow,
        compression: false, // Disable compression to avoid dependency issues
        preContent: RECS_HEADERS.join('\n') + '\n', // Add RECS headers before CSV data
        config, // Pass configuration for CSV generation
      });

      // Convert Buffer to string for compatibility
      return {
        content: result.content.toString(),
        stats: result.stats,
      };
    } catch (coreError) {
      // Log core module failure before falling back
      console.warn(`Core CSV generation failed: ${coreError.message}`);
      throw coreError; // Re-throw to trigger fallback
    }
  } catch (error) {
    try {
      // Fallback to simple CSV generation if core module fails
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
          rowCount: products.length,
        },
      };
    } catch (fallbackError) {
      // If both methods fail, throw a descriptive error
      throw new Error(
        `Failed to create CSV: Primary method failed (${error.message}), fallback method also failed (${fallbackError.message})`
      );
    }
  }
}

/**
 * Validates CSV headers format
 * Pure function that checks if headers match RECS requirements.
 *
 * @param {Array<Object>} headers - Header configuration array
 * @returns {boolean} True if headers are valid
 */
function validateCsvHeaders(headers) {
  if (!Array.isArray(headers)) {
    return false;
  }

  const requiredFields = ['sku', 'name', 'category_id', 'message', 'thumbnail_url', 'value'];
  const headerIds = headers.map((h) => h.id);

  return requiredFields.every((field) => headerIds.includes(field));
}

/**
 * Formats CSV content with RECS headers
 * Pure function that adds RECS headers to CSV content.
 *
 * @param {string} csvContent - Raw CSV content
 * @returns {string} CSV content with RECS headers
 */
function formatCsvWithRecsHeaders(csvContent) {
  return RECS_HEADERS.join('\n') + '\n' + csvContent;
}

module.exports = {
  createCsv,
  validateCsvHeaders,
  formatCsvWithRecsHeaders,
  RECS_HEADERS,
  CSV_HEADERS,
};
