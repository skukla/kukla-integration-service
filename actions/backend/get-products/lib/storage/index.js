/**
 * Storage operations for file handling
 * @module storage
 */

const { getStorageConfig } = require('./config');

/**
 * Stores a file in the configured storage location
 * @async
 * @param {string} content - File content to store
 * @param {string} fileName - Name of the file to store
 * @returns {Promise<Object>} Storage result
 * @property {string} fileName - Name of the stored file
 * @property {string} location - Storage location
 * @property {string} downloadUrl - URL to download the file via the download-file action
 * @throws {Error} If file operation fails
 */
async function storeFile(content, fileName) {
  try {
    // Get storage configuration
    const { location, files } = await getStorageConfig();

    // Create a buffer from the content
    const buffer = Buffer.from(content);

    // Store the file in the public directory to make it accessible
    const publicFileName = `public/${fileName}`;

    // Write the file
    await files.write(publicFileName, buffer);

    // Get file properties
    const properties = await files.getProperties(publicFileName);

    return {
      fileName: publicFileName,
      location,
      downloadUrl: properties.url || properties.internalUrl,
      properties,
    };
  } catch (error) {
    throw new Error(`Failed to store file: ${error.message}`);
  }
}

module.exports = {
  storeFile,
};
