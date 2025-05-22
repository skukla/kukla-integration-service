/**
 * Stores the generated CSV file in the configured storage location.
 * @module steps/storeCsv
 */

const { storeFile } = require('../lib/storage');

/**
 * Stores the generated CSV file
 * @param {{fileName: string, content: string}} csvFile - CSV file information
 * @returns {Promise<Object>} Storage result object
 * @property {string} downloadUrl - The URL where the file can be accessed
 * @property {string} location - The storage type ('filestore' or 's3')
 * @property {string} fileName - The name of the stored file
 * @throws {Error} If storage configuration is invalid or storage operation fails
 */
async function storeCsv(csvFile) {
  try {
    return await storeFile(csvFile.content, csvFile.fileName);
  } catch (error) {
    throw new Error(`Failed to store CSV file: ${error.message}`);
  }
}

module.exports = storeCsv; 