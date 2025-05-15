/**
 * Storage configuration for file operations
 * @module storage/config
 */

const FilesLib = require('@adobe/aio-lib-files');

/**
 * Gets the storage configuration for file operations
 * @returns {Promise<Object>} Storage configuration object
 * @property {string} location - Storage location (e.g., 'filestore')
 * @property {Object} files - Files SDK instance
 * @throws {Error} If Files SDK initialization fails
 */
async function getStorageConfig() {
  try {
    // Initialize the Files SDK
    const files = await FilesLib.init();
    
    return {
      location: 'filestore',
      files
    };
  } catch (error) {
    throw new Error(`Failed to initialize Files SDK: ${error.message}`);
  }
}

module.exports = {
  getStorageConfig
}; 