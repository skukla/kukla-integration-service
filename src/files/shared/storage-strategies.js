/**
 * Files Shared Storage Strategies
 * Complete storage strategy pattern implementation with pure functions
 */

const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const { createUrlBuilders } = require('../../shared/routing/url-factory');
const { createS3BrowserWrapper } = require('../file-browser/storage-operations');
const {
  createAppBuilderStorageWrapper,
  createS3StorageWrapper,
} = require('../file-deletion/storage-operations');

/**
 * Initialize storage strategy based on configuration
 * @purpose Main interface for initializing storage from config and params
 * @param {Object} config - Configuration object with storage provider settings
 * @param {Object} params - Action parameters for authentication
 * @returns {Promise<Object>} Initialized storage interface
 * @throws {Error} When storage initialization fails
 * @usedBy All file operations requiring storage access
 *
 * @interface StorageStrategy
 * Required methods that all storage strategies must implement:
 * - deleteFile(fileName): Delete a file
 * - getFileMetadata(fileName): Get file metadata
 * - fileExists(fileName): Check if file exists
 * - list(): List all files
 * - getProperties(fileName): Get detailed file properties
 * - read(fileName): Read file content
 * - store(storageParams): Store file and return download URLs
 */
async function initializeStorageStrategy(config, params) {
  const provider = config.storage.provider;
  return await selectStorageStrategy(provider, config, params);
}

/**
 * Determine storage strategy from configuration
 * @purpose Get storage strategy function without initializing
 * @param {Object} config - Configuration object with storage provider settings
 * @param {Object} params - Action parameters for authentication
 * @returns {Promise<Object>} Storage strategy interface
 * @throws {Error} When strategy determination fails
 * @usedBy Storage operations requiring strategy selection
 */
async function determineStorageStrategy(config, params) {
  return await initializeStorageStrategy(config, params);
}

// Strategy Operations (Strategy coordination and selection)

/**
 * Strategy Selector Function
 * Pure function that selects and executes the appropriate storage strategy.
 *
 * @param {string} provider - Storage provider name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage interface
 * @throws {Error} If strategy not found
 * @usedBy initializeStorageStrategy for provider-specific strategy execution
 */
async function selectStorageStrategy(provider, config, params) {
  const strategy = STORAGE_STRATEGIES[provider];

  if (!strategy) {
    throw new Error(
      `Unknown storage provider: ${provider}. Available: ${Object.keys(STORAGE_STRATEGIES).join(', ')}`
    );
  }

  return await strategy(config, params);
}

/**
 * Add Storage Strategy
 * Pure function to extend strategies without modifying existing code.
 *
 * @param {string} name - Strategy name
 * @param {Function} strategyFunction - Pure strategy function
 * @returns {Object} Updated strategies object (immutable)
 * @usedBy Strategy extension workflows requiring new storage providers
 */
function addStorageStrategy(name, strategyFunction) {
  return {
    ...STORAGE_STRATEGIES,
    [name]: strategyFunction,
  };
}

/**
 * Get available storage strategies
 * @purpose List all available storage provider names
 * @returns {Array<string>} Array of available strategy names
 * @usedBy Configuration validation and help text generation
 */
function getAvailableStorageStrategies() {
  return Object.keys(STORAGE_STRATEGIES);
}

// Strategy Implementations (Individual strategy functions)

/**
 * App Builder Storage Strategy
 * Pure function that creates App Builder storage interface.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters (required for interface consistency)
 * @returns {Promise<Object>} Storage interface
 */
// eslint-disable-next-line no-unused-vars
async function appBuilderStorageStrategy(config, params) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient();
  const baseWrapper = createAppBuilderStorageWrapper(files, config);

  // Add store method for CSV export functionality
  return {
    ...baseWrapper,
    async store(storageParams) {
      try {
        // Store the file using App Builder Files
        const fullFileName = `${config.storage.directory}/${storageParams.fileName}`;
        await files.write(fullFileName, storageParams.content);

        // Build download URL using URL factory pattern
        const { downloadUrl } = createUrlBuilders(config);
        const fileDownloadUrl = downloadUrl(storageParams.fileName);

        return {
          downloadUrl: fileDownloadUrl,
          storage: 'app-builder',
          fileName: storageParams.fileName,
          properties: {
            size: storageParams.size,
            contentType: storageParams.mimeType,
          },
          management: {
            fileExisted: false, // Simplified for now
            urlGenerated: true,
          },
        };
      } catch (error) {
        throw new Error(`App Builder storage failed: ${error.message}`);
      }
    },
  };
}

/**
 * S3 Storage Strategy
 * Pure function that creates S3 storage interface.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage interface
 */
// eslint-disable-next-line no-unused-vars
async function s3StorageStrategy(config, params) {
  validateS3Environment(config, params);
  const s3Client = await createS3Client(config, params);

  // Create unified S3 storage wrapper combining both deletion and browser operations
  const deletionWrapper = createS3StorageWrapper(s3Client, config);
  const browserWrapper = createS3BrowserWrapper(s3Client, config);

  // Add store method for CSV export functionality
  return {
    ...deletionWrapper,
    ...browserWrapper,
    async store(storageParams) {
      try {
        const bucket = config.storage.s3.bucket;
        const prefix = config.storage.s3.prefix || '';
        const key = `${prefix}${storageParams.fileName}`;

        // Store the file in S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: storageParams.content,
            ContentType: storageParams.mimeType,
          })
        );

        // Build download URL
        const { downloadUrl } = createUrlBuilders(config);
        const fileDownloadUrl = downloadUrl(storageParams.fileName);

        return {
          downloadUrl: fileDownloadUrl,
          storage: 's3',
          fileName: storageParams.fileName,
          properties: {
            size: storageParams.size,
            contentType: storageParams.mimeType,
            bucket,
            key,
          },
          management: {
            fileExisted: false, // Simplified for now
            urlGenerated: true,
          },
        };
      } catch (error) {
        throw new Error(`S3 storage failed: ${error.message}`);
      }
    },
  };
}

// Strategy Utilities (Most atomic building blocks)

/**
 * Validate App Builder environment is available
 * @purpose Check if App Builder Files service is accessible
 * @throws {Error} When environment validation fails
 * @usedBy appBuilderStorageStrategy
 */
function validateAppBuilderEnvironment() {
  // Basic environment validation
  // In real implementation, this would check for required credentials
}

/**
 * Validate S3 environment and credentials
 * @purpose Check if S3 credentials and configuration are available
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing AWS credentials
 * @throws {Error} When S3 validation fails
 * @usedBy s3StorageStrategy
 */
function validateS3Environment(config, params) {
  if (!config.storage?.s3) {
    throw new Error('S3 configuration missing in config.storage.s3');
  }

  // Check for credentials in params (Adobe I/O Runtime) or environment
  const accessKeyId = params.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = params.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials missing. Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  }

  if (!config.storage.s3.bucket) {
    throw new Error('S3 bucket not configured in config.storage.s3.bucket');
  }
}

/**
 * Create App Builder client from parameters
 * @purpose Initialize App Builder Files client from action parameters
 * @returns {Promise<Object>} App Builder Files client
 * @usedBy appBuilderStorageStrategy
 */
async function createAppBuilderClient() {
  // Use Adobe I/O SDK Files client
  const { Files } = require('@adobe/aio-sdk');
  return await Files.init();
}

/**
 * Create S3 client from configuration and parameters
 * @purpose Initialize AWS S3 client with credentials from action parameters or environment
 * @param {Object} config - Configuration object with S3 settings
 * @param {Object} params - Action parameters containing AWS credentials
 * @returns {Promise<Object>} S3 client instance
 * @usedBy s3StorageStrategy
 */
async function createS3Client(config, params) {
  // Get credentials from params (Adobe I/O Runtime) or environment (scripts)
  const accessKeyId = params.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = params.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  return new S3Client({
    region: config.storage.s3.region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Storage Strategy Registry
 * Pure object mapping strategy names to strategy functions.
 * No classes - just function references.
 */
const STORAGE_STRATEGIES = {
  'app-builder': appBuilderStorageStrategy,
  s3: s3StorageStrategy,
};

module.exports = {
  // Strategy interface functions (what other files import)
  initializeStorageStrategy,
  determineStorageStrategy,

  // Strategy operations (coordination functions)
  selectStorageStrategy,
  addStorageStrategy,
  getAvailableStorageStrategies,

  // Strategy implementations (individual strategies)
  appBuilderStorageStrategy,
  s3StorageStrategy,

  // Strategy utilities (building blocks)
  STORAGE_STRATEGIES,
};
