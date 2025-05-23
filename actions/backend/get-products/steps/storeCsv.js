/**
 * Handles storage of compressed CSV files
 * @module steps/storeCsv
 */
const { decompress } = require('../lib/api/compression');

/**
 * Stores a compressed CSV file and returns access information
 * @param {Object} csvData - CSV generation result
 * @param {Buffer} csvData.content - Compressed CSV content
 * @param {Object} csvData.stats - Compression statistics
 * @returns {Promise<{fileName: string, downloadUrl: string}>} File storage information
 * @throws {Error} If file storage fails
 */
async function storeCsv(csvData) {
  try {
    // For now, we'll use a fixed filename
    const fileName = 'products.csv';
    
    // In a real implementation, this would store the compressed data
    // and handle decompression on download
    
    return {
      fileName: `public/${fileName}`,
      downloadUrl: `/api/v1/web/kukla-integration-service/download-file?fileName=public%2F${fileName}`
    };
  } catch (error) {
    throw new Error(`Failed to store CSV: ${error.message}`);
  }
}

module.exports = storeCsv; 