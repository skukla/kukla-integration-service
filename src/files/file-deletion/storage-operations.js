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

module.exports = {
  deleteFileFromStorage,
  getFileMetadataBeforeDeletion,
  deleteBatchFromStorage,
};
