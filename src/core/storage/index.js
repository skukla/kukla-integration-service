/**
 * Unified Storage Provider
 * @module core/storage
 * @description Provides a unified interface for different storage providers (S3, Adobe I/O Files)
 */

const Files = require('@adobe/aio-lib-files');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const cache = require('./cache');
const csv = require('./csv');
const files = require('./files');
const { loadConfig } = require('../../../config');
const { formatFileSize, formatDate } = require('../data/transformation');
const { buildRuntimeUrl } = require('../routing');

/**
 * Initialize Adobe I/O Files (App Builder) storage
 * @param {Object} [config] - Configuration object
 * @param {Object} [params] - Action parameters for URL building
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeAppBuilderStorage(params = {}) {
  const owApiKey = process.env.__OW_API_KEY;
  const owNamespace = process.env.__OW_NAMESPACE;

  if (!owApiKey || !owNamespace) {
    throw new Error(
      `OpenWhisk credentials not found for App Builder storage. API Key: ${!!owApiKey}, Namespace: ${!!owNamespace}`
    );
  }

  const files = await Files.init();

  if (!files || typeof files.write !== 'function') {
    throw new Error('App Builder Files SDK initialization failed - invalid instance');
  }

  // Test basic functionality
  try {
    const testList = await files.list();
    // Log storage test results if debug logging is enabled
    if (params.LOG_LEVEL === 'debug' || params.LOG_LEVEL === 'trace') {
      const { Core } = require('@adobe/aio-sdk');
      const logger = Core.Logger('storage-init', { level: params.LOG_LEVEL });
      logger.debug('AppBuilder file list test successful', { fileCount: testList.length });
    }
  } catch (listError) {
    throw new Error(`Adobe I/O Files list operation failed: ${listError.message}`);
  }

  return {
    provider: 'app-builder',
    client: files,

    async write(fileName, content) {
      // Store files in public directory for organization and accessibility
      const publicFileName = `public/${fileName}`;
      await files.write(publicFileName, content);
      const properties = await files.getProperties(publicFileName);

      // Generate action-based download URL for consistent interface across providers
      const actionUrl =
        buildRuntimeUrl('download-file', null, params) +
        `?fileName=${encodeURIComponent(fileName)}`;

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
    },

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

    async list(directory = 'public/') {
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
    },

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
 * Initialize AWS S3 storage
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeS3Storage(config, params = {}) {
  const s3Config = config.storage.s3;
  if (!s3Config.bucket) {
    throw new Error('S3 bucket not configured');
  }

  const accessKeyId = params.AWS_ACCESS_KEY_ID;
  const secretAccessKey = params.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found in action parameters');
  }

  const s3Client = new S3Client({
    region: s3Config.region || 'us-east-1',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    provider: 's3',
    client: s3Client,
    bucket: s3Config.bucket,
    prefix: s3Config.prefix || '',

    async write(fileName, content) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: content,
        ContentType: 'text/csv',
        // Note: Public access should be configured via S3 bucket policy
        // rather than object ACLs for better security and modern S3 practices
      });

      await s3Client.send(command);

      // Generate action-based download URL instead of direct S3 URL
      // This allows secure access without requiring public S3 bucket policy
      const actionUrl =
        buildRuntimeUrl('download-file', null, params) +
        `?fileName=${encodeURIComponent(fileName)}`;

      return {
        fileName: key,
        url: actionUrl, // Use action URL instead of direct S3 URL
        downloadUrl: actionUrl, // Use action URL for downloads
        properties: {
          name: fileName,
          key,
          bucket: s3Config.bucket,
          size: content.length,
          lastModified: new Date().toISOString(),
          contentType: 'text/csv',
        },
      };
    },

    async read(fileName) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;

      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      });

      const response = await s3Client.send(command);

      // Convert stream to buffer
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

    async list(directory = '') {
      // Both app-builder and S3 now use public/ prefix for unified organization
      const prefix = s3Config.prefix || '';
      const fullPrefix = directory ? `${prefix}${directory}` : prefix;

      const command = new ListObjectsV2Command({
        Bucket: s3Config.bucket,
        Prefix: fullPrefix,
      });

      const response = await s3Client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((object) => ({
        name: object.Key.replace(prefix, ''), // Remove prefix for display
        fullPath: object.Key,
        size: formatFileSize(object.Size),
        lastModified: formatDate(object.LastModified),
        contentType: 'text/csv', // Default for our use case
      }));
    },

    async getProperties(fileName) {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;

      const command = new ListObjectsV2Command({
        Bucket: s3Config.bucket,
        Prefix: key,
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        throw new Error(`File not found: ${fileName}`);
      }

      const object = response.Contents[0];
      return {
        name: fileName,
        size: object.Size,
        lastModified: object.LastModified,
        contentType: 'text/csv',
        key: object.Key,
        bucket: s3Config.bucket,
      };
    },
  };
}

/**
 * Initialize storage provider based on configuration
 * @param {Object} [params] - Action parameters containing credentials
 * @returns {Promise<Object>} Initialized storage client
 */
async function initializeStorage(params = {}) {
  const config = loadConfig(params); // ← Pass params to use our environment fix!
  const provider = config.storage.provider;

  switch (provider) {
    case 'app-builder':
      try {
        const storage = await initializeAppBuilderStorage(params);
        return storage;
      } catch (error) {
        throw new Error(`Adobe I/O Files storage initialization failed: ${error.message}`);
      }
    case 's3':
      try {
        const storage = await initializeS3Storage(config, params);
        return storage;
      } catch (error) {
        throw new Error(`S3 storage initialization failed: ${error.message}`);
      }
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

module.exports = {
  initializeStorage,
  initializeAppBuilderStorage,
  initializeS3Storage,

  // Public API for external consumption
  public: {
    csv,
    cache,
    files,
    initializeStorage,
  },
};
