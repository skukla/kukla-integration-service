/**
 * File Deletion - Storage Operations Sub-module
 * All storage initialization, deletion operations, and metadata retrieval utilities
 */

const { initializeStorageStrategy } = require('../shared/storage-strategies');

// Storage Operations Workflows

/**
 * Delete file from storage
 * @purpose Execute file deletion through storage provider
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<void>} Resolves when deletion is complete
 * @throws {Error} When deletion fails
 * @usedBy deleteFileWithValidation, deleteFile
 */
async function deleteFileFromStorage(fileName, config, params) {
  const storage = await initializeStorageStrategy(config, params);
  return await storage.deleteFile(fileName);
}

/**
 * Get file metadata before deletion
 * @purpose Retrieve file information for confirmation response
 * @param {string} fileName - Name of the file
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} File metadata object
 * @usedBy deleteFileWithValidation
 */
async function getFileMetadataBeforeDeletion(fileName, config, params) {
  try {
    const storage = await initializeStorageStrategy(config, params);
    return await storage.getFileMetadata(fileName);
  } catch (error) {
    // Return minimal metadata if retrieval fails
    return {
      fileName,
      exists: false,
      retrievedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Delete multiple files in batch
 * @purpose Execute batch deletion operation
 * @param {Array} fileNames - Array of filenames to delete
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Batch deletion result
 * @usedBy deleteFilesBatch
 */
async function deleteBatchFromStorage(fileNames, config, params) {
  const storage = await initializeStorageStrategy(config, params);
  const results = {
    successful: [],
    failed: [],
    total: fileNames.length,
  };

  for (const fileName of fileNames) {
    try {
      await storage.deleteFile(fileName);
      results.successful.push(fileName);
    } catch (error) {
      results.failed.push({
        fileName,
        error: error.message,
      });
    }
  }

  return results;
}

// Storage Operations Utilities

/**
 * Create App Builder storage wrapper for deletion operations
 * @purpose Wrap App Builder Files client with deletion-specific methods
 * @param {Object} files - App Builder Files client
 * @returns {Object} Storage wrapper with deletion methods
 * @usedBy initializeAppBuilderStorage
 */
function createAppBuilderStorageWrapper(files) {
  return {
    async deleteFile(fileName) {
      try {
        await files.delete(fileName);
        return { success: true, fileName };
      } catch (error) {
        throw new Error(`App Builder deletion failed: ${error.message}`);
      }
    },

    async getFileMetadata(fileName) {
      try {
        const stats = await files.getProperties(fileName);
        return {
          fileName,
          size: stats.contentLength,
          lastModified: stats.lastModified,
          exists: true,
          provider: 'app-builder',
        };
      } catch (error) {
        throw new Error(`Failed to get file metadata: ${error.message}`);
      }
    },

    async fileExists(fileName) {
      try {
        await files.getProperties(fileName);
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}

module.exports = {
  deleteFileFromStorage,
  getFileMetadataBeforeDeletion,
  deleteBatchFromStorage,
  createAppBuilderStorageWrapper,
};
