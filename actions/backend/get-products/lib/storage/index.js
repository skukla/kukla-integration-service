/**
 * Storage operations for file handling
 * @module storage
 */

const { Files: FilesLib } = require('@adobe/aio-sdk');

/**
 * Stores a file in the configured storage location
 * @async
 * @param {string} content - File content to store
 * @param {string} [fileName] - Name of the file to store (optional, uses config default if not provided)
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Storage result
 * @property {string} fileName - Name of the stored file
 * @property {string} location - Storage location
 * @property {string} downloadUrl - URL to download the file via the download-file action
 * @throws {Error} If file operation fails
 */
async function storeFile(content, fileName = null, config) {
  try {
    // For now, we only support app-builder provider
    // This could be extended to support S3 in the future
    if (config.storage.provider !== 'app-builder') {
      throw new Error(
        `Unsupported storage provider: ${config.storage.provider}. Only 'app-builder' is currently supported.`
      );
    }

    // Initialize Files SDK
    const files = await FilesLib.init();

    // Use provided fileName or fall back to config default
    const finalFileName = fileName || config.storage.csv.filename;

    // Create a buffer from the content
    const buffer = Buffer.from(content);

    // Store the file in the public directory to make it accessible
    const publicFileName = `public/${finalFileName}`;

    // Write the file
    await files.write(publicFileName, buffer);

    // Get file properties
    const properties = await files.getProperties(publicFileName);

    return {
      fileName: publicFileName,
      location: config.storage.provider,
      downloadUrl: properties.url || properties.internalUrl,
      properties: {
        ...properties,
        size: buffer.length, // Add the actual file size in bytes
      },
    };
  } catch (error) {
    throw new Error(`Failed to store file: ${error.message}`);
  }
}

module.exports = {
  storeFile,
};
