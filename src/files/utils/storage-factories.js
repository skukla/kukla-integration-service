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

const { buildRuntimeUrl } = require('../../shared/routing');
const { formatFileSize, formatDate } = require('../../shared/utils');

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
    // Store files in public directory for organization and accessibility
    const publicFileName = `public/${fileName}`;
    await files.write(publicFileName, content);
    const properties = await files.getProperties(publicFileName);

    // Generate action-based download URL for consistent interface across providers
    const actionUrl =
      buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fileName)}`;

    return {
      fileName: publicFileName, // Return the full path for consistency
      url: actionUrl, // Use action URL instead of direct file URL
      downloadUrl: actionUrl, // Use action URL for downloads
      properties: {
        name: fileName, // But keep the original name in properties
        size: content.length,
        lastModified: properties.lastModified,
        contentType: properties.contentType || 'text/csv',
        internalUrl: properties.url, // Keep the original URL for internal reference
      },
    };
  };
}

/**
 * Creates the list method for App Builder storage
 * Pure function factory that creates list method implementation.
 *
 * @param {Object} files - Files client instance
 * @returns {Function} List method implementation
 */
function createAppBuilderListMethod(files) {
  return async function list(directory = 'public/') {
    // Both app-builder and S3 now use public/ prefix for unified organization
    const fileList = await files.list();
    const filteredFiles = fileList.filter((file) => file.name.startsWith(directory));

    // Get metadata for each file
    const filesWithMetadata = await Promise.all(
      filteredFiles.map(async (file) => {
        try {
          const properties = await files.getProperties(file.name);
          const content = await files.read(file.name);
          return {
            name: file.name.replace(/^public\//, ''), // Remove public prefix for display
            fullPath: file.name,
            size: formatFileSize(content.length),
            lastModified: formatDate(properties.lastModified),
            contentType: properties.contentType || 'application/octet-stream',
          };
        } catch (error) {
          // If we can't read file metadata, include basic info
          return {
            name: file.name.replace(/^public\//, ''),
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
  return {
    provider: 'app-builder',
    client: files,

    write: createAppBuilderWriteMethod(files, config),

    async read(fileName) {
      // Handle both full path and filename-only
      const fullPath = fileName.startsWith('public/') ? fileName : `public/${fileName}`;
      return await files.read(fullPath);
    },

    async delete(fileName) {
      // Handle both full path and filename-only
      const fullPath = fileName.startsWith('public/') ? fileName : `public/${fileName}`;
      await files.delete(fullPath);
    },

    list: createAppBuilderListMethod(files),

    async getProperties(fileName) {
      // Handle both full path and filename-only
      const fullPath = fileName.startsWith('public/') ? fileName : `public/${fileName}`;
      const properties = await files.getProperties(fullPath);
      return {
        name: fileName.replace(/^public\//, ''), // Return clean name
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
    const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: content,
      ContentType: 'text/csv',
    });

    await s3Client.send(command);

    // Generate action-based download URL for consistent interface across providers
    const actionUrl =
      buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fileName)}`;

    return {
      fileName: key,
      url: actionUrl,
      downloadUrl: actionUrl,
      properties: {
        name: fileName,
        size: content.length,
        lastModified: new Date().toISOString(),
        contentType: 'text/csv',
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
function createS3ListMethod(s3Client, s3Config) {
  return async function list() {
    const prefix = s3Config.prefix || '';
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    return response.Contents.map((item) => ({
      name: item.Key.replace(prefix, ''),
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
  return {
    provider: 's3',
    client: s3Client,
    bucket: s3Config.bucket,
    prefix: s3Config.prefix || '',

    write: createS3WriteMethod(s3Client, s3Config, config),

    async read(fileName) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;
      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      });

      const response = await s3Client.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },

    async delete(fileName) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      });

      await s3Client.send(command);
    },

    list: createS3ListMethod(s3Client, s3Config),

    async getProperties(fileName) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;
      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
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
