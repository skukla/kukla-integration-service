/**
 * Storage operations for file handling
 * @module storage
 */

const { getStorageConfig } = require('./config');
const { 
    http: { APP_PREFIX },
    storage: {
        writeFile,
        getFileProperties,
        FileOperationError,
        FileErrorType
    }
} = require('../../../../src/core');

/**
 * Builds a download URL for a file
 * @param {string} fileName - Name of the file
 * @returns {string} Download URL
 */
function buildDownloadUrl(fileName) {
    return `${APP_PREFIX}/download-file?fileName=${encodeURIComponent(fileName)}`;
}

/**
 * Stores a file in the configured storage location
 * @async
 * @param {string} content - File content to store
 * @param {string} fileName - Name of the file to store
 * @returns {Promise<Object>} Storage result
 * @property {string} fileName - Name of the stored file
 * @property {string} location - Storage location
 * @property {string} downloadUrl - URL to download the file via the download-file action
 * @throws {FileOperationError} If file operation fails
 */
async function storeFile(content, fileName) {
    try {
        // Get storage configuration
        const { location, files } = await getStorageConfig();
        
        // Create a buffer from the content
        const buffer = Buffer.from(content);
        
        // Store the file in the public directory to make it accessible
        const publicFileName = `public/${fileName}`;
        
        // Use shared file operations to write and verify the file
        await writeFile(files, publicFileName, buffer);
        await getFileProperties(files, publicFileName);
        
        // Get the download URL for the file
        const downloadUrl = buildDownloadUrl(publicFileName);
        
        return {
            fileName: publicFileName,
            location,
            downloadUrl
        };
    } catch (error) {
        // If it's already a FileOperationError, rethrow it
        if (error instanceof FileOperationError) {
            throw error;
        }
        
        // Otherwise, wrap it in a FileOperationError
        throw new FileOperationError(
            FileErrorType.UNKNOWN,
            `Failed to store file: ${error.message}`,
            error
        );
    }
}

module.exports = {
    storeFile
}; 