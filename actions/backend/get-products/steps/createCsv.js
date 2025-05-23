const { generateCsv } = require('../lib/csv/generator');

/**
 * Creates a CSV file from the transformed product data
 * @param {Object[]} products - Transformed product objects
 * @returns {Promise<{fileName: string, content: Buffer, stats: Object}>} CSV file information
 * @property {string} fileName - The name of the generated CSV file
 * @property {Buffer} content - The compressed CSV content
 * @property {Object} stats - Compression statistics
 */
async function createCsv(products) {
  try {
    // Generate CSV content with compression
    const { content, stats } = await generateCsv(products);

    // Return with fixed filename and include compression stats
    return {
      fileName: 'products.csv',
      content,
      stats
    };
  } catch (error) {
    throw new Error(`Failed to create CSV: ${error.message}`);
  }
}

module.exports = createCsv;