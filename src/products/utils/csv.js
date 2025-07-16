/**
 * CSV Utilities for Product Export
 *
 * Simple CSV generation utilities for product data export.
 * Now includes RECS headers and proper row mapping for Adobe Recommendations compatibility.
 */

const { mapProductToCsvRow } = require('../operations/transformation');

/**
 * Generates CSV configuration from domain config
 * @param {Object} config - Domain configuration
 * @returns {Object} CSV configuration
 */
function generateCsvConfig(config) {
  const csvConfig = config.products.csv;
  return {
    headers: csvConfig.headers.map((h) => ({ id: h.id, title: h.title })),
    preContent: csvConfig.recsHeaders.join('\n') + '\n',
  };
}

/**
 * Creates CSV headers row from configuration
 * @param {Object} csvConfig - CSV configuration from generateCsvConfig
 * @returns {string} Header row as CSV string
 */
function createCsvHeaders(csvConfig) {
  return csvConfig.headers.map((h) => h.title).join(',');
}

/**
 * Converts product data to CSV row using proper transformation
 * @param {Object} product - Product data object
 * @param {Object} csvConfig - CSV configuration from generateCsvConfig
 * @returns {string} CSV row string
 */
function createCsvRow(product, csvConfig) {
  const csvRowData = mapProductToCsvRow(product);

  return csvConfig.headers
    .map((h) => {
      const value = csvRowData[h.id] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    })
    .join(',');
}

/**
 * Converts products array to complete CSV content with RECS headers
 * @param {Array<Object>} products - Array of product objects
 * @param {Object} config - Domain configuration
 * @returns {string} Complete CSV content with RECS headers and proper row mapping
 */
function convertToCSV(products, config) {
  const csvConfig = generateCsvConfig(config);
  const headers = createCsvHeaders(csvConfig);
  const rows = products.map((product) => createCsvRow(product, csvConfig));

  // Include RECS headers + CSV headers + data rows
  return csvConfig.preContent + headers + '\n' + rows.join('\n');
}

/**
 * Formats CSV content with RECS headers from config
 * @param {string} csvContent - CSV content without RECS headers
 * @param {Object} config - Domain configuration
 * @returns {string} CSV content with RECS headers
 */
function formatCsvWithRecsHeaders(csvContent, config) {
  const recsHeaders = config.products.csv.recsHeaders.join('\n');
  return recsHeaders + '\n' + csvContent;
}

module.exports = {
  generateCsvConfig,
  createCsvHeaders,
  createCsvRow,
  convertToCSV,
  formatCsvWithRecsHeaders,
};
