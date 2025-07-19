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

    async read(fileName) {
      try {
        return await files.read(fileName);
      } catch (error) {
        throw new Error(`App Builder file read failed: ${error.message}`);
      }
    },
  };
}

/**
 * Create S3 storage wrapper for deletion operations
 * @purpose Wrap S3 client with deletion-specific methods
 * @param {Object} s3Client - AWS S3 client instance
 * @param {Object} config - Configuration object with S3 settings
 * @returns {Object} Storage wrapper with deletion methods
 * @usedBy s3StorageStrategy in storage-strategies.js
 */
function createS3StorageWrapper(s3Client, config) {
  const bucket = config.storage.s3.bucket;
  const prefix = config.storage.s3.prefix || '';

  return {
    async deleteFile(fileName) {
      return await executeS3DeleteFile(s3Client, bucket, prefix, fileName);
    },

    async getFileMetadata(fileName) {
      return await executeS3GetFileMetadata(s3Client, bucket, prefix, fileName);
    },

    async fileExists(fileName) {
      return await executeS3FileExists(s3Client, bucket, prefix, fileName);
    },

    async read(fileName) {
      return await executeS3ReadFile(s3Client, bucket, prefix, fileName);
    },
  };
}

// S3 Operation Utilities

/**
 * Execute S3 file deletion
 * @purpose Delete file from S3 bucket
 * @param {Object} s3Client - S3 client instance
 * @param {string} bucket - S3 bucket name
 * @param {string} prefix - S3 key prefix
 * @param {string} fileName - File name to delete
 * @returns {Promise<Object>} Deletion result
 */
async function executeS3DeleteFile(s3Client, bucket, prefix, fileName) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  try {
    const key = `${prefix}${fileName}`;
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return { success: true, fileName };
  } catch (error) {
    throw new Error(`S3 deletion failed: ${error.message}`);
  }
}

/**
 * Execute S3 file metadata retrieval
 * @purpose Get file metadata from S3
 * @param {Object} s3Client - S3 client instance
 * @param {string} bucket - S3 bucket name
 * @param {string} prefix - S3 key prefix
 * @param {string} fileName - File name to get metadata for
 * @returns {Promise<Object>} File metadata
 */
async function executeS3GetFileMetadata(s3Client, bucket, prefix, fileName) {
  const { HeadObjectCommand } = require('@aws-sdk/client-s3');
  try {
    const key = `${prefix}${fileName}`;
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return {
      fileName,
      size: response.ContentLength,
      lastModified: response.LastModified,
      exists: true,
      provider: 's3',
    };
  } catch (error) {
    throw new Error(`Failed to get S3 file metadata: ${error.message}`);
  }
}

/**
 * Execute S3 file existence check
 * @purpose Check if file exists in S3
 * @param {Object} s3Client - S3 client instance
 * @param {string} bucket - S3 bucket name
 * @param {string} prefix - S3 key prefix
 * @param {string} fileName - File name to check
 * @returns {Promise<boolean>} Whether file exists
 */
async function executeS3FileExists(s3Client, bucket, prefix, fileName) {
  const { HeadObjectCommand } = require('@aws-sdk/client-s3');
  try {
    const key = `${prefix}${fileName}`;
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Execute S3 file read
 * @purpose Read file content from S3
 * @param {Object} s3Client - S3 client instance
 * @param {string} bucket - S3 bucket name
 * @param {string} prefix - S3 key prefix
 * @param {string} fileName - File name to read
 * @returns {Promise<Buffer>} File content
 */
async function executeS3ReadFile(s3Client, bucket, prefix, fileName) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  try {
    const key = `${prefix}${fileName}`;
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    throw new Error(`S3 file read failed: ${error.message}`);
  }
}

module.exports = {
  deleteFileFromStorage,
  getFileMetadataBeforeDeletion,
  deleteBatchFromStorage,
  createAppBuilderStorageWrapper,
  createS3StorageWrapper,
};
