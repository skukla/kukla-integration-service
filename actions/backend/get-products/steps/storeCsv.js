/**
 * CSV storage step for product export - Multi-Provider Implementation
 * @module steps/storeCsv
 */
const Files = require('@adobe/aio-lib-files');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { loadConfig } = require('../../../../config');

/**
 * Initialize Adobe I/O Files (App Builder) storage
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeAppBuilderStorage() {
  // Check for OpenWhisk environment variables
  const owApiKey = process.env.__OW_API_KEY;
  const owNamespace = process.env.__OW_NAMESPACE;

  if (!owApiKey || !owNamespace) {
    throw new Error('OpenWhisk credentials not found for App Builder storage');
  }

  const files = await Files.init();

  if (!files || typeof files.write !== 'function') {
    throw new Error('App Builder Files SDK initialization failed - invalid instance');
  }

  return {
    provider: 'app-builder',
    client: files,
    write: async (fileName, content) => {
      await files.write(fileName, content);
      const properties = await files.getProperties(fileName);
      return {
        fileName,
        url: properties.url,
        internalUrl: properties.internalUrl,
        properties,
      };
    },
  };
}

/**
 * Initialize AWS S3 storage
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Storage client wrapper
 */
async function initializeS3Storage(config) {
  const s3Config = config.storage?.s3;
  if (!s3Config?.bucket) {
    throw new Error('S3 bucket not configured');
  }

  // Use environment variables or config for AWS credentials
  const credentials = {};
  if (s3Config.accessKeyId) {
    credentials.accessKeyId = s3Config.accessKeyId;
  }
  if (s3Config.secretAccessKey) {
    credentials.secretAccessKey = s3Config.secretAccessKey;
  }

  const s3Client = new S3Client({
    region: s3Config.region || 'us-east-1',
    ...(Object.keys(credentials).length > 0 && { credentials }),
  });

  return {
    provider: 's3',
    client: s3Client,
    bucket: s3Config.bucket,
    prefix: s3Config.prefix || '',
    write: async (fileName, content) => {
      const key = s3Config.prefix ? `${s3Config.prefix}${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: content,
        ContentType: 'text/csv',
      });

      await s3Client.send(command);

      const url = `https://${s3Config.bucket}.s3.${s3Config.region || 'us-east-1'}.amazonaws.com/${key}`;

      return {
        fileName: key,
        url,
        properties: {
          name: fileName,
          key,
          bucket: s3Config.bucket,
          contentType: 'text/csv',
        },
      };
    },
  };
}

/**
 * Initialize storage provider based on configuration
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Initialized storage client
 */
async function initializeStorageProvider(config) {
  const provider = config.storage?.provider || 'app-builder';

  switch (provider) {
    case 'app-builder':
      return await initializeAppBuilderStorage();
    case 's3':
      return await initializeS3Storage(config);
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

/**
 * Stores a CSV file using the configured storage provider
 * @param {Object|string} csvResult - CSV generation result or simple string content
 * @returns {Promise<Object>} Storage result with file information
 */
async function storeCsv(csvResult) {
  // Handle both complex CSV result object and simple string content
  const content = typeof csvResult === 'string' ? csvResult : csvResult.content;
  const stats = typeof csvResult === 'object' && csvResult.stats ? csvResult.stats : null;

  // Load configuration
  const config = loadConfig();
  const fileName = config.storage?.csv?.filename || 'products.csv';
  const timestamp = new Date().toISOString();

  try {
    // Initialize storage provider
    const storage = await initializeStorageProvider(config);

    // Store the file (overwrites existing file)
    const result = await storage.write(fileName, content);

    const response = {
      fileName: result.fileName,
      downloadUrl: result.url,
      properties: {
        name: fileName,
        size: `${content.length} bytes`,
        lastModified: result.properties?.lastModified || timestamp,
        contentType: 'text/csv',
        ...result.properties,
      },
      stored: true,
      timestamp,
      storageType: storage.provider,
      overwritten: true,
    };

    // Add compression stats if available
    if (stats) {
      response.compressionStats = stats;
    }

    return response;
  } catch (error) {
    // Return error response without storage fallback
    return {
      fileName,
      downloadUrl: null,
      properties: {
        name: fileName,
        size: `${content.length} bytes`,
        lastModified: timestamp,
        contentType: 'text/csv',
      },
      stored: false,
      timestamp,
      storageType: 'error',
      overwritten: false,
      compressionStats: stats,
      error: {
        message: error.message,
        type: 'storage-failed',
      },
    };
  }
}

module.exports = storeCsv;
