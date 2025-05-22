const { generateCsv } = require('../lib/csv/generator');

/**
 * Creates a CSV file from the transformed product data
 * @param {Object[]} products - Transformed product objects
 * @returns {Promise<{fileName: string, content: string}>} CSV file information
 * @property {string} fileName - The name of the generated CSV file
 * @property {string} content - The CSV content as a string
 */
async function createCsv(products) {
  try {
    // Generate CSV content
    const csvContent = await generateCsv(products);

    // Return with fixed filename for consistency
    return {
      fileName: 'products.csv',
      content: csvContent
    };
  } catch (error) {
    throw new Error(`Failed to create CSV: ${error.message}`);
  }
}

module.exports = createCsv;