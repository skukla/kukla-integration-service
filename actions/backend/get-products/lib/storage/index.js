/**
 * Storage operations for file handling
 * @module storage
 */

const { getStorageConfig } = require('./config');
const { getDownloadUrl } = require('../../utils/url/download');

/**
 * Stores a file in the configured storage location
 * @async
 * @param {string} content - File content to store
 * @param {string} fileName - Name of the file to store
 * @returns {Promise<Object>} Storage result
 * @property {string} fileName - Name of the stored file
 * @property {string} location - Storage location
 * @property {string} downloadUrl - URL to download the file via the download-file action
 */
async function storeFile(content, fileName) {
  try {
    // Get storage configuration
    const { location, files } = await getStorageConfig();
    
    // Create a buffer from the content
    const buffer = Buffer.from(content);
    
    // Store the file in the public directory to make it accessible
    const publicFileName = `public/${fileName}`;
    await files.write(publicFileName, buffer);
    
    // Verify the file exists by getting its properties
    await files.getProperties(publicFileName);
    
    // Get the download URL for the file
    const downloadUrl = getDownloadUrl(fileName);
    
    return {
      fileName: publicFileName,
      location,
      downloadUrl
    };
  } catch (error) {
    throw new Error(`Failed to store file: ${error.message}`);
  }
}

module.exports = {
  storeFile
}; 