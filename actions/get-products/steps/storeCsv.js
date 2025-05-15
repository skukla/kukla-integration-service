/**
 * Stores the generated CSV file in the configured storage location.
 * @module steps/storeCsv
 */

const { storeFile } = require('../lib/storage');

/**
 * Stores the generated CSV file in the configured storage location.
 * 
 * @param {string} content - The CSV content to store
 * @param {string} fileName - The name to use for the stored file
 * @returns {Promise<Object>} Storage result object
 * @property {string} downloadUrl - The URL where the file can be accessed
 * @property {string} location - The storage type ('filestore' or 's3')
 * @property {string} fileName - The name of the stored file
 * @throws {Error} If storage configuration is invalid or storage operation fails
 */
module.exports = async function storeCsv(content, fileName) {
  try {
    return await storeFile(content, fileName);
  } catch (error) {
    throw new Error(`Failed to store CSV file: ${error.message}`);
  }
}; 