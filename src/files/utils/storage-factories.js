/**
 * Storage Factory Utilities
 *
 * Low-level pure functions for creating storage wrapper methods.
 * Contains factory functions that create storage provider interfaces.
 */

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const { buildStorageFilePath, ensureStorageDirectoryPath } = require('./paths');
const { buildFileDownloadUrl } = require('./url-building');
const { formatFileSize, formatDate } = require('../../core/utils/operations/formatting');
const { generatePresignedUrl } = require('../operations/presigned-urls');

/**
 * Creates the write method for App Builder storage
 * Pure function factory that creates write method implementation.
 *
 * @param {Object} files - Files client instance
 * @param {Object} config - Configuration object
 * @returns {Function} Write method implementation
 */
function createAppBuilderWriteMethod(files, config) {
  return async function write(fileName, content) {
    // Store files in configured directory for organization and accessibility
    const storageDirectory = config.storage.directory;
    const fullFileName = buildStorageFilePath(fileName, storageDirectory);
    await files.write(fullFileName, content);
    const properties = await files.getProperties(fullFileName);

    // Generate action-based download URL for consistent interface across providers
    const actionUrl = buildFileDownloadUrl(fileName, config);

    // Generate presigned URL for public access
    let presignedUrlResult = null;
    if (config.storage.presignedUrls.enabled) {
      try {
        const storage = { provider: 'app-builder', client: files };
        presignedUrlResult = await generatePresignedUrl(storage, fileName, config, {
          expiresIn: config.storage.presignedUrls.expiration.short,
        });
      } catch (error) {
        console.warn('Failed to generate presigned URL:', error.message);
      }
    }

    return {
      fileName: fullFileName, // Return the full path for consistency
      url: actionUrl, // Use action URL for fallback
      downloadUrl: actionUrl, // Use action URL for downloads
      presignedUrl: presignedUrlResult?.success ? presignedUrlResult.presignedUrl : null,
      properties: {
        name: fileName, // But keep the original name in properties
        size: content.length,
        lastModified: properties.lastModified,
        contentType: properties.contentType || 'text/csv',
        internalUrl: properties.url, // Keep the original URL for internal reference
        presigned: presignedUrlResult, // Include full presigned URL info
      },
    };
  };
}

/**
 * Creates the list method for App Builder storage
 * Pure function factory that creates list method implementation.
 *
 * @param {Object} files - Files client instance
 * @param {Object} config - Configuration object
 * @returns {Function} List method implementation
 */
function createAppBuilderListMethod(files, config) {
  return async function list(directory = null) {
    const storageDirectory = config.storage.directory;
    const listDirectory = directory || storageDirectory;
    const fileList = await files.list();
    const filteredFiles = fileList.filter((file) => file.name.startsWith(listDirectory));

    // Get metadata for each file
    const filesWithMetadata = await Promise.all(
      filteredFiles.map(async (file) => {
        try {
          const properties = await files.getProperties(file.name);
          const content = await files.read(file.name);
          return {
            name: file.name.replace(new RegExp(`^${storageDirectory.replace('/', '\\/')}`), ''), // Remove directory prefix for display
            fullPath: file.name,
            size: formatFileSize(content.length),
            lastModified: formatDate(properties.lastModified),
            contentType: properties.contentType || 'application/octet-stream',
          };
        } catch (error) {
          // If we can't read file metadata, include basic info
          return {
            name: file.name.replace(new RegExp(`^${storageDirectory.replace('/', '\\/')}`), ''),
            fullPath: file.name,
            size: 'Unknown',
            lastModified: 'Unknown',
            contentType: 'application/octet-stream',
          };
        }
      })
    );

    return filesWithMetadata;
  };
}

/**
 * Creates the storage wrapper methods for App Builder
 * Pure function factory that creates complete App Builder storage interface.
 *
 * @param {Object} files - Files client instance
 * @param {Object} config - Configuration object
 * @returns {Object} Storage wrapper with methods
 */
function createAppBuilderStorageWrapper(files, config) {
  const storageDirectory = config.storage.directory;

  return {
    provider: 'app-builder',
    client: files,

    write: createAppBuilderWriteMethod(files, config),

    async read(fileName) {
      // Handle both full path and filename-only
      const fullPath = ensureStorageDirectoryPath(fileName, storageDirectory);
      return await files.read(fullPath);
    },

    async delete(fileName) {
      // Handle both full path and filename-only
      const fullPath = fileName.startsWith(storageDirectory)
        ? fileName
        : `${storageDirectory}${fileName}`;
      await files.delete(fullPath);
    },

    list: createAppBuilderListMethod(files, config),

    async getProperties(fileName) {
      // Handle both full path and filename-only
      const fullPath = fileName.startsWith(storageDirectory)
        ? fileName
        : `${storageDirectory}${fileName}`;
      const properties = await files.getProperties(fullPath);
      return {
        name: fileName.replace(new RegExp(`^${storageDirectory.replace('/', '\\/')}`), ''), // Return clean name
        size: properties.size,
        lastModified: properties.lastModified,
        contentType: properties.contentType || 'application/octet-stream',
      };
    },
  };
}

/**
 * Creates the write method for S3 storage
 * Pure function factory that creates S3 write method implementation.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Full configuration object
 * @returns {Function} Write method implementation
 */
function createS3WriteMethod(s3Client, s3Config, config) {
  return async function write(fileName, content) {
    // Include both prefix and storage directory in the key
    const storageDirectory = config.storage.directory || '';
    const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fullPath,
      Body: content,
      ContentType: 'text/csv',
    });

    await s3Client.send(command);

    // Generate action-based download URL for consistent interface across providers
    const actionUrl = buildFileDownloadUrl(fileName, config);

    // Generate presigned URL for public access
    let presignedUrlResult = null;
    if (config.storage.presignedUrls.enabled) {
      try {
        const storage = {
          provider: 's3',
          client: s3Client,
          bucket: s3Config.bucket,
          prefix: s3Config.prefix,
        };
        presignedUrlResult = await generatePresignedUrl(storage, fileName, config, {
          expiresIn: config.storage.presignedUrls.expiration.short,
        });
      } catch (error) {
        console.warn('Failed to generate presigned URL:', error.message);
      }
    }

    return {
      fileName: fullPath, // Return the full path including storage directory
      url: actionUrl, // Use action URL for fallback
      downloadUrl: actionUrl, // Use action URL for downloads
      presignedUrl: presignedUrlResult?.success ? presignedUrlResult.presignedUrl : null,
      properties: {
        name: fileName,
        size: content.length,
        lastModified: new Date().toISOString(),
        contentType: 'text/csv',
        bucket: s3Config.bucket, // Include bucket name for storage display
        directory: storageDirectory, // Include directory for proper display
        presigned: presignedUrlResult, // Include full presigned URL info
      },
    };
  };
}

/**
 * Creates the list method for S3 storage
 * Pure function factory that creates S3 list method implementation.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @returns {Function} List method implementation
 */
function createS3ListMethod(s3Client, s3Config, config) {
  return async function list() {
    // Include both prefix and storage directory in the list prefix
    const storageDirectory = config.storage.directory || '';
    const fullPrefix = buildStorageFilePath('', storageDirectory, s3Config.prefix);

    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: fullPrefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((item) => ({
      name: item.Key.replace(fullPrefix, ''),
      fullPath: item.Key,
      size: formatFileSize(item.Size),
      lastModified: formatDate(item.LastModified),
      contentType: 'application/octet-stream',
    }));
  };
}

/**
 * Creates S3 storage wrapper methods
 * Pure function factory that creates complete S3 storage interface.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Full configuration object
 * @returns {Object} Storage wrapper with methods
 */
function createS3StorageWrapper(s3Client, s3Config, config) {
  const storageDirectory = config.storage.directory || '';

  return {
    provider: 's3',
    client: s3Client,
    bucket: s3Config.bucket,
    prefix: s3Config.prefix || '',

    write: createS3WriteMethod(s3Client, s3Config, config),

    async read(fileName) {
      // Include both prefix and storage directory in the key
      const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);
      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: fullPath,
      });

      const response = await s3Client.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },

    async delete(fileName) {
      // Include both prefix and storage directory in the key
      const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucket,
        Key: fullPath,
      });

      await s3Client.send(command);
    },

    list: createS3ListMethod(s3Client, s3Config, config),

    async getProperties(fileName) {
      // Include both prefix and storage directory in the key
      const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);
      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: fullPath,
      });

      try {
        const response = await s3Client.send(command);
        return {
          name: fileName,
          size: response.ContentLength,
          lastModified: response.LastModified.toISOString(),
          contentType: response.ContentType,
        };
      } catch (error) {
        if (error.name === 'NoSuchKey') {
          return null;
        }
        throw error;
      }
    },
  };
}

module.exports = {
  createAppBuilderWriteMethod,
  createAppBuilderListMethod,
  createAppBuilderStorageWrapper,
  createS3WriteMethod,
  createS3ListMethod,
  createS3StorageWrapper,
};
