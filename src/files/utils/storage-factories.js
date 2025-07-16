/**
 * Storage Factory Utilities
 */

const {
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const { buildStorageFilePath } = require('./paths');
const { buildFileDownloadUrl } = require('./url-building');
const { formatFileSize, formatDate } = require('../../core/utils/operations/formatting');
const { updateContentOnly } = require('../operations/content-only');
const { generatePresignedUrl } = require('../operations/presigned-urls');

/**
 * Creates the write method for App Builder storage
 * Pure function factory focused only on file storage.
 *
 * @param {Object} files - Files client instance
 * @param {Object} config - Configuration object
 * @returns {Function} Write method implementation
 */
function createAppBuilderWriteMethod(files, config) {
  return async function write(fileName, content, options = {}) {
    // Store file in configured directory
    const storageDirectory = config.storage.directory;
    const fullFileName = buildStorageFilePath(fileName, storageDirectory);
    await files.write(fullFileName, content);

    // Get file properties and generate URLs
    const properties = await files.getProperties(fullFileName);
    const actionUrl = buildFileDownloadUrl(fileName, config);

    // Handle presigned URL generation using consolidated utility
    const storage = { provider: 'app-builder', client: files };
    const presignedUrlResult = await generatePresignedUrl(storage, fileName, config, options);

    // Build standardized response using operations layer
    return {
      fileName: fullFileName,
      url: actionUrl,
      downloadUrl: actionUrl,
      presignedUrl: presignedUrlResult?.success ? presignedUrlResult.presignedUrl : null,
      properties: {
        name: fileName,
        size: content.length,
        lastModified: properties.lastModified,
        contentType: properties.contentType || 'text/csv',
        internalUrl: properties.url,
        presigned: presignedUrlResult,
      },
    };
  };
}

/**
 * Creates the list method for App Builder storage
 * Pure function factory focused only on file listing.
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
    return await Promise.all(
      filteredFiles.map(async (file) => {
        try {
          const properties = await files.getProperties(file.name);
          const content = await files.read(file.name);
          return {
            name: file.name.replace(new RegExp(`^${storageDirectory.replace('/', '\\/')}`), ''),
            fullPath: file.name,
            size: formatFileSize(content.length),
            lastModified: formatDate(properties.lastModified),
            contentType: properties.contentType || 'application/octet-stream',
          };
        } catch (error) {
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
  };
}

/**
 * Creates the write method for S3 storage
 * Pure function factory focused only on S3 storage.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Full configuration object
 * @returns {Function} Write method implementation
 */
function createS3WriteMethod(s3Client, s3Config, config) {
  return async function write(fileName, content, options = {}) {
    // Build S3 key and store file
    const storageDirectory = config.storage.directory || '';
    const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fullPath,
      Body: content,
      ContentType: 'text/csv',
    });
    await s3Client.send(command);

    // Generate URLs
    const actionUrl = buildFileDownloadUrl(fileName, config);

    // Handle presigned URL generation using consolidated utility
    const storage = {
      provider: 's3',
      client: s3Client,
      bucket: s3Config.bucket,
      prefix: s3Config.prefix,
    };
    const presignedUrlResult = await generatePresignedUrl(storage, fileName, config, options);

    // Build standardized response using operations layer
    return {
      fileName: fullPath,
      url: actionUrl,
      downloadUrl: actionUrl,
      presignedUrl: presignedUrlResult?.success ? presignedUrlResult.presignedUrl : null,
      properties: {
        name: fileName,
        size: content.length,
        lastModified: new Date().toISOString(),
        contentType: 'text/csv',
        bucket: s3Config.bucket,
        directory: storageDirectory,
        presigned: presignedUrlResult,
      },
    };
  };
}

/**
 * Creates the list method for S3 storage
 * Pure function factory focused only on S3 listing.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Configuration object
 * @returns {Function} List method implementation
 */
function createS3ListMethod(s3Client, s3Config, config) {
  return async function list() {
    const storageDirectory = config.storage.directory || '';
    const fullPrefix = buildStorageFilePath('', storageDirectory, s3Config.prefix);

    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: fullPrefix,
    });

    const response = await s3Client.send(command);
    const objects = response.Contents || [];

    return objects.map((obj) => ({
      name: obj.Key.replace(fullPrefix, ''),
      fullPath: obj.Key,
      size: formatFileSize(obj.Size),
      lastModified: formatDate(obj.LastModified),
      contentType: 'text/csv',
    }));
  };
}

/**
 * Creates App Builder storage wrapper
 * Wrapper factory that creates storage interface.
 *
 * @param {Object} files - Files client instance
 * @param {Object} config - Configuration object
 * @returns {Object} Storage wrapper interface
 */
function createAppBuilderStorageWrapper(files, config) {
  const storageDirectory = config.storage.directory;

  return {
    provider: 'app-builder',
    write: createAppBuilderWriteMethod(files, config),
    list: createAppBuilderListMethod(files, config),
    writeContentOnly: createWriteContentOnlyMethod({ provider: 'app-builder', client: files }),

    async read(fileName) {
      const fullPath = fileName.startsWith(storageDirectory)
        ? fileName
        : `${storageDirectory}${fileName}`;
      return await files.read(fullPath);
    },

    async delete(fileName) {
      const fullPath = fileName.startsWith(storageDirectory)
        ? fileName
        : `${storageDirectory}${fileName}`;
      await files.delete(fullPath);
    },

    async getProperties(fileName) {
      const fullPath = fileName.startsWith(storageDirectory)
        ? fileName
        : `${storageDirectory}${fileName}`;
      try {
        return await files.getProperties(fullPath);
      } catch (error) {
        return null; // File doesn't exist
      }
    },
  };
}

/**
 * Creates the read method for S3 storage
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Configuration object
 * @returns {Function} S3 read method
 */
function createS3ReadMethod(s3Client, s3Config, config) {
  return async function read(fileName) {
    const storageDirectory = config.storage.directory || '';
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
  };
}

/**
 * Creates the delete method for S3 storage
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Configuration object
 * @returns {Function} S3 delete method
 */
function createS3DeleteMethod(s3Client, s3Config, config) {
  return async function deleteFile(fileName) {
    const storageDirectory = config.storage.directory || '';
    const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);

    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: fullPath,
    });

    await s3Client.send(command);
  };
}

/**
 * Creates the getProperties method for S3 storage
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Configuration object
 * @returns {Function} S3 getProperties method
 */
function createS3GetPropertiesMethod(s3Client, s3Config, config) {
  return async function getProperties(fileName) {
    const storageDirectory = config.storage.directory || '';
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
        return null; // File doesn't exist
      }
      throw error;
    }
  };
}

/**
 * Creates S3 storage wrapper
 * Wrapper factory that creates storage interface.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Storage wrapper interface
 */
function createS3StorageWrapper(s3Client, s3Config, config) {
  const storage = {
    provider: 's3',
    client: s3Client,
    bucket: s3Config.bucket,
    prefix: s3Config.prefix,
  };

  return {
    provider: 's3',
    write: createS3WriteMethod(s3Client, s3Config, config),
    list: createS3ListMethod(s3Client, s3Config, config),
    writeContentOnly: createWriteContentOnlyMethod(storage),
    read: createS3ReadMethod(s3Client, s3Config, config),
    delete: createS3DeleteMethod(s3Client, s3Config, config),
    getProperties: createS3GetPropertiesMethod(s3Client, s3Config, config),
  };
}

/**
 * Creates the writeContentOnly method for any storage provider
 * Pure function factory that creates content-only write method implementation.
 *
 * @param {Object} storage - Storage wrapper configuration
 * @returns {Function} WriteContentOnly method implementation
 */
function createWriteContentOnlyMethod(storage) {
  return async function writeContentOnly(fileName, content, config) {
    return await updateContentOnly(storage, fileName, content, config);
  };
}

module.exports = {
  createAppBuilderWriteMethod,
  createAppBuilderListMethod,
  createAppBuilderStorageWrapper,
  createS3WriteMethod,
  createS3ListMethod,
  createS3StorageWrapper,
  createWriteContentOnlyMethod,
};
