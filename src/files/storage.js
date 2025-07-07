/**
 * Core storage provider abstraction
 * @module files/storage
 * @description Unified interface for different storage providers (S3, Adobe I/O Files)
 */

const { Files } = require('@adobe/aio-sdk');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const { buildRuntimeUrl } = require('../shared/routing');
const { formatFileSize, formatDate } = require('../shared/utils');

/**
 * Validates the Adobe I/O Runtime environment for App Builder storage
 * @private
 * @throws {Error} If OpenWhisk credentials are missing
 */
function validateAppBuilderEnvironment() {
  const owApiKey = process.env.__OW_API_KEY;
  const owNamespace = process.env.__OW_NAMESPACE;

  if (!owApiKey || !owNamespace) {
    throw new Error(
      `OpenWhisk credentials not found for App Builder storage. API Key: ${!!owApiKey}, Namespace: ${!!owNamespace}`
    );
  }
}

/**
 * Creates and tests the Adobe I/O Files client
 * @private
 * @param {Object} params - Action parameters for logging
 * @returns {Promise<Object>} Initialized Files client
 */
async function createAppBuilderClient(params) {
  const files = await Files.init();

  if (!files || typeof files.write !== 'function') {
    throw new Error('App Builder Files SDK initialization failed - invalid instance');
  }

  // Test basic functionality
  try {
    const testList = await files.list();
    // Log storage test results if debug logging is enabled
    if (params.LOG_LEVEL === 'debug' || params.LOG_LEVEL === 'trace') {
      try {
        const { Core } = require('@adobe/aio-sdk');
        const logger = Core.Logger('storage-init', { level: params.LOG_LEVEL });
        logger.debug('AppBuilder file list test successful', { fileCount: testList.length });
      } catch (logError) {
        // Ignore logging errors to prevent storage initialization from failing
      }
    }
  } catch (listError) {
    throw new Error(`Adobe I/O Files list operation failed: ${listError.message}`);
  }

  return files;
}

/**
 * Creates the write method for App Builder storage
 * @private
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
 * @private
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
 * @private
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
 * Initialize Adobe I/O Files storage
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters for logging
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeAppBuilderStorage(config, params = {}) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient(params);
  return createAppBuilderStorageWrapper(files, config);
}

/**
 * Validates S3 configuration and credentials
 * @private
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Object} Validated S3 configuration
 */
function validateS3Config(config, params) {
  const s3Config = config.storage.s3;
  if (!s3Config.bucket) {
    throw new Error('S3 bucket not configured');
  }

  const accessKeyId = params.AWS_ACCESS_KEY_ID;
  const secretAccessKey = params.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found in action parameters');
  }

  return {
    s3Config,
    accessKeyId,
    secretAccessKey,
  };
}

/**
 * Creates S3 client with credentials
 * @private
 * @param {Object} s3Config - S3 configuration
 * @param {string} accessKeyId - AWS access key ID
 * @param {string} secretAccessKey - AWS secret access key
 * @returns {Object} S3 client instance
 */
function createS3Client(s3Config, accessKeyId, secretAccessKey) {
  return new S3Client({
    region: s3Config.region || 'us-east-1',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Creates the write method for S3 storage
 * @private
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

    const actionUrl =
      buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fileName)}`;

    const s3Url = `https://${s3Config.bucket}.s3.${
      s3Config.region || 'us-east-1'
    }.amazonaws.com/${key}`;

    return {
      fileName: key,
      url: actionUrl,
      downloadUrl: actionUrl,
      properties: {
        name: fileName,
        key,
        bucket: s3Config.bucket,
        size: content.length,
        lastModified: new Date().toISOString(),
        contentType: 'text/csv',
        internalUrl: s3Url,
      },
    };
  };
}

/**
 * Creates the list method for S3 storage
 * @private
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
 * @private
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

/**
 * Initialize AWS S3 storage
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeS3Storage(config, params = {}) {
  const { s3Config, accessKeyId, secretAccessKey } = validateS3Config(config, params);
  const s3Client = createS3Client(s3Config, accessKeyId, secretAccessKey);
  return createS3StorageWrapper(s3Client, s3Config, config);
}

/**
 * Initialize storage provider based on configuration
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} [params] - Action parameters containing credentials
 * @returns {Promise<Object>} Initialized storage client
 */
async function initializeStorage(config, params = {}) {
  const provider = config.storage.provider;

  switch (provider) {
    case 'app-builder':
      try {
        const storage = await initializeAppBuilderStorage(config, params);
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
};
