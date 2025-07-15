/**
 * Content-Only Operations
 *
 * Mid-level business logic for updating file content without presigned URL generation.
 * Contains operations that coordinate content updates while preserving existing presigned URLs.
 */

const { buildStorageFilePath } = require('../utils/paths');
const { buildFileDownloadUrl } = require('../utils/url-building');

/**
 * Update S3 file content without generating presigned URLs
 * Business operation that updates file content directly using AWS SDK.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration (bucket, prefix)
 * @param {string} fileName - Name of the file
 * @param {string} content - File content
 * @param {Object} config - Full configuration object
 * @returns {Promise<Object>} Content update result without presigned URL
 */
async function updateS3ContentOnly(s3Client, s3Config, fileName, content, config) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');

  const storageDirectory = config.storage.directory || '';
  const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: fullPath,
    Body: content,
    ContentType: 'text/csv',
  });

  await s3Client.send(command);

  // Use existing URL building utility
  const actionUrl = buildFileDownloadUrl(fileName, config);

  return {
    fileName: fullPath,
    url: actionUrl,
    downloadUrl: actionUrl,
    presignedUrl: null, // Explicitly null - not generated
    properties: {
      name: fileName,
      size: content.length,
      lastModified: new Date().toISOString(),
      contentType: 'text/csv',
      bucket: s3Config.bucket,
      directory: storageDirectory,
    },
  };
}

/**
 * Update App Builder file content without generating presigned URLs
 * Business operation that updates file content directly using Files SDK.
 *
 * @param {Object} files - Files client instance
 * @param {string} fileName - Name of the file
 * @param {string} content - File content
 * @param {Object} config - Full configuration object
 * @returns {Promise<Object>} Content update result without presigned URL
 */
async function updateAppBuilderContentOnly(files, fileName, content, config) {
  const storageDirectory = config.storage.directory;
  const fullFileName = buildStorageFilePath(fileName, storageDirectory);

  await files.write(fullFileName, content);
  const properties = await files.getProperties(fullFileName);

  // Use existing URL building utility
  const actionUrl = buildFileDownloadUrl(fileName, config);

  return {
    fileName: fullFileName,
    url: actionUrl,
    downloadUrl: actionUrl,
    presignedUrl: null, // Explicitly null - not generated
    properties: {
      name: fileName,
      size: content.length,
      lastModified: properties.lastModified,
      contentType: properties.contentType || 'text/csv',
      internalUrl: properties.url,
    },
  };
}

/**
 * Update file content without generating presigned URLs for any provider
 * High-level business operation that delegates to provider-specific implementations.
 *
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file
 * @param {string} content - File content
 * @param {Object} config - Full configuration object
 * @returns {Promise<Object>} Content update result
 */
async function updateContentOnly(storage, fileName, content, config) {
  switch (storage.provider) {
    case 's3':
      return await updateS3ContentOnly(
        storage.client,
        { bucket: storage.bucket, prefix: storage.prefix },
        fileName,
        content,
        config
      );

    case 'app-builder':
      return await updateAppBuilderContentOnly(storage.client, fileName, content, config);

    default:
      throw new Error(`Unsupported storage provider for content-only update: ${storage.provider}`);
  }
}

module.exports = {
  updateS3ContentOnly,
  updateAppBuilderContentOnly,
  updateContentOnly,
};
