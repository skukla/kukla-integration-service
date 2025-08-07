/**
 * Generic CSV Generation for Adobe App Builder
 * Pure orchestration - delegates all business logic to format implementations
 */

const RecsFormat = require('./formats/recs');

/**
 * Create CSV content using format-specific logic
 * @param {Array} products - Array of product objects
 * @returns {Object} CSV result with content and stats
 */
function createCsv(products) {
  // Transform products using format
  const transformedProducts = products.map((product) => RecsFormat.transformProduct(product));

  // Get structure from format
  const fileHeaders = RecsFormat.getFileHeaders();
  const columnHeaders = RecsFormat.getColumnHeaders().join(',');
  const fieldOrder = RecsFormat.getFieldOrder();

  // Create CSV data rows (only generic CSV formatting)
  const dataRows = transformedProducts.map((product) => {
    return fieldOrder
      .map((fieldId) => {
        const value = product[fieldId] || '';
        // Simple CSV escaping
        return value.toString().includes(',') ? `"${value}"` : value;
      })
      .join(',');
  });

  // Combine all parts
  const csvContent = [...fileHeaders, columnHeaders, ...dataRows].join('\n');

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
};
