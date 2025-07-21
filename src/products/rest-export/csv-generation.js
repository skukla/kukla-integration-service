/**
 * REST Export - CSV Generation Sub-module
 * All CSV formatting and generation utilities for REST API export
 */

// CSV Generation Workflows

/**
 * Convert products to CSV format
 * @purpose Transform product array into CSV string with RECS headers from configuration
 * @param {Array} products - Array of built product objects
 * @param {Object} config - Configuration object containing RECS headers
 * @returns {Promise<string>} CSV formatted string with RECS headers and data
 * @usedBy exportProducts in rest-export.js
 */
async function convertToCSV(products, config) {
  try {
    // Step 1: Get RECS headers from configuration
    const csvConfig = config.products.csv;
    const recsHeaders = csvConfig.recsHeaders || [];
    const columnHeaders = csvConfig.headers || [];

    // Step 2: Convert products to CSV rows using RECS field mapping
    const rows = products.map((product) => createCsvRow(product, columnHeaders));

    // Step 3: Format complete CSV with RECS prefix headers
    return formatCsvWithRecsHeaders(recsHeaders, columnHeaders, rows);
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
 * Create CSV row from product data
 * @purpose Convert single product object to CSV row array using RECS field mapping
 * @param {Object} product - Built product object
 * @param {Array} columnHeaders - Array of column header configurations
 * @returns {Array} Array of values for CSV row
 * @usedBy convertToCSV
 */
function createCsvRow(product, columnHeaders) {
  // RECS field mapping according to requirements (like master branch)
  const fieldMap = {
    sku: () => product.sku || '',
    name: () => product.name || '',
    category_id: () => extractCsvCategoryId(product.categories),
    message: () => extractProductMessage(product),
    thumbnail_url: () => '',
    value: () => String(parseFloat(product.price) || 0),
    page_url: () => '',
    inventory: () => String(parseInt(product.qty, 10) || 0),
    margin: () => '',
    type: () => '',
    custom2: () => '',
    custom3: () => '',
    custom4: () => '',
    custom5: () => '',
    custom6: () => '',
    custom7: () => '',
    custom8: () => '',
    custom9: () => '',
    custom10: () => '',
  };

  return columnHeaders.map((headerConfig) => {
    const fieldId = headerConfig.id;
    const getValue = fieldMap[fieldId] || (() => ''); // Default to blank for unmapped fields
    return escapeCsvValue(getValue());
  });
}

/**
 * Extract first category name for CSV export (entirely dynamic)
 * @purpose Get the first category name using enriched category data from Commerce API
 * @param {Array} categories - Array of enriched category objects with real names from API
 * @returns {string} First category name from Commerce API or fallback
 * @usedBy createCsvRow
 */
function extractCsvCategoryId(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  const firstCategory = categories[0];

  // Use enriched category data with real name from Commerce API - PRIMARY
  if (firstCategory && typeof firstCategory === 'object' && firstCategory.name) {
    return firstCategory.name;
  }

  // Fallback for any other format (should not be needed if enrichment works)
  if (typeof firstCategory === 'string') {
    return firstCategory;
  }

  // Final fallback
  return '';
}

/**
 * Extract product message for CSV export (from master branch)
 * @purpose Create a product message from name and description
 * @param {Object} product - Product object
 * @returns {string} Product message for CSV
 * @usedBy createCsvRow
 */
function extractProductMessage(product) {
  if (!product || typeof product !== 'object') {
    return '';
  }
  return product.name || '';
}

/**
 * Format CSV with RECS headers and rows
 * @purpose Combine RECS prefix headers, column headers, and data rows into complete CSV string
 * @param {Array} recsHeaders - Array of RECS prefix header strings
 * @param {Array} columnHeaders - Array of column header configurations
 * @param {Array} rows - Array of row arrays
 * @returns {string} Complete CSV formatted string with RECS format
 * @usedBy convertToCSV
 */
function formatCsvWithRecsHeaders(recsHeaders, columnHeaders, rows) {
  const csvLines = [];

  // Step 1: Add RECS prefix headers (comment lines)
  recsHeaders.forEach((recsHeader) => {
    csvLines.push(recsHeader);
  });

  // Step 2: Create column header row using RECS titles
  const headerTitles = columnHeaders.map((header) => header.title);
  const headerRow = headerTitles.map((title) => `"${title}"`).join(',');
  csvLines.push(headerRow);

  // Step 3: Add data rows
  const dataRows = rows.map((row) => row.map((value) => `"${value}"`).join(','));
  csvLines.push(...dataRows);

  return csvLines.join('\n') + '\n';
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
  convertToCSV,
  generateCsvConfig,
  createCsvRow,
  formatCsvWithRecsHeaders,
  escapeCsvValue,
  extractCsvCategoryId,
  extractProductMessage,
};
