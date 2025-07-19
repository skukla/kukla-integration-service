/**
 * REST Export - CSV Generation Sub-module
 * All CSV formatting and generation utilities for REST API export
 */

// CSV Generation Workflows

/**
 * Convert products to CSV format
 * @purpose Transform product array into CSV string with headers
 * @param {Array} products - Array of built product objects
 * @returns {Promise<string>} CSV formatted string with headers and data
 * @usedBy exportProducts in rest-export.js
 */
async function convertToCSV(products) {
  try {
    // Step 1: Generate CSV headers
    const headers = createCsvHeaders();

    // Step 2: Convert products to CSV rows
    const rows = products.map((product) => createCsvRow(product));

    // Step 3: Format complete CSV with headers
    return formatCsvWithRecsHeaders(headers, rows);
  } catch (error) {
    throw new Error(`CSV conversion failed: ${error.message}`);
  }
}

// CSV Generation Utilities

/**
 * Generate CSV configuration settings
 * @purpose Define CSV formatting configuration and options
 * @returns {Object} CSV configuration object
 * @usedBy convertToCSV
 */
function generateCsvConfig() {
  return {
    delimiter: ',',
    quote: '"',
    escape: '"',
    linebreak: '\n',
    header: true,
  };
}

/**
 * Create CSV headers array
 * @purpose Define the column headers for CSV export
 * @returns {Array} Array of header strings
 * @usedBy convertToCSV
 */
function createCsvHeaders() {
  return [
    'sku',
    'name',
    'description',
    'short_description',
    'price',
    'special_price',
    'type_id',
    'status',
    'visibility',
    'weight',
    'qty',
    'is_in_stock',
    'categories',
    'category_ids',
    'images',
    'image',
    'created_at',
    'updated_at',
  ];
}

/**
 * Create CSV row from product data
 * @purpose Convert single product object to CSV row array
 * @param {Object} product - Built product object
 * @returns {Array} Array of values for CSV row
 * @usedBy convertToCSV
 */
function createCsvRow(product) {
  const fields = [
    'sku',
    'name',
    'description',
    'short_description',
    'price',
    'special_price',
    'type_id',
    'status',
    'visibility',
    'weight',
    'qty',
    'is_in_stock',
    'categories',
    'category_ids',
    'images',
    'image',
    'created_at',
    'updated_at',
  ];

  return fields.map((field) => {
    const value = product[field] || (field === 'price' ? '0' : '');
    return escapeCsvValue(value);
  });
}

/**
 * Format CSV with headers and rows
 * @purpose Combine headers and data rows into complete CSV string
 * @param {Array} headers - Array of header strings
 * @param {Array} rows - Array of row arrays
 * @returns {string} Complete CSV formatted string
 * @usedBy convertToCSV
 */
function formatCsvWithRecsHeaders(headers, rows) {
  // Step 1: Create header row
  const headerRow = headers.map((header) => `"${header}"`).join(',');

  // Step 2: Create data rows
  const dataRows = rows.map((row) => row.map((value) => `"${value}"`).join(','));

  // Step 3: Combine header and data
  const allRows = [headerRow, ...dataRows];

  return allRows.join('\n') + '\n';
}

/**
 * Escape CSV value for safe inclusion
 * @purpose Escape quotes and special characters in CSV values
 * @param {string} value - Value to escape
 * @returns {string} Escaped value safe for CSV
 * @usedBy createCsvRow
 */
function escapeCsvValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }

  // Escape double quotes by doubling them
  return value.replace(/"/g, '""');
}

module.exports = {
  // Workflows (used by feature core)
  convertToCSV,

  // Utilities (available for testing/extension)
  generateCsvConfig,
  createCsvHeaders,
  createCsvRow,
  formatCsvWithRecsHeaders,
  escapeCsvValue,
};
