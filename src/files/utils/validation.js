/**
 * Storage Validation Utilities
 *
 * Low-level pure validation functions for storage operations.
 * Contains utilities for validating storage configurations and environments.
 */

const { Files } = require('@adobe/aio-sdk');
const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Validates the Adobe I/O Runtime environment for App Builder storage
 * Pure function that checks for required OpenWhisk credentials.
 *
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
 * Pure function that initializes and validates Files SDK client.
 *
 * @param {Object} params - Action parameters for logging
 * @returns {Promise<Object>} Initialized Files client
 * @throws {Error} If Files SDK initialization fails
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
 * Validates S3 configuration and credentials
 * Pure function that checks S3 config and extracts credentials from params.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Object} Validated S3 configuration
 * @throws {Error} If S3 configuration is invalid or credentials missing
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
 * Creates an S3 client with the provided configuration
 * Pure function that creates and configures S3 client.
 *
 * @param {Object} s3Config - S3 configuration
 * @param {string} accessKeyId - AWS access key ID
 * @param {string} secretAccessKey - AWS secret access key
 * @returns {S3Client} Configured S3 client
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

module.exports = {
  validateAppBuilderEnvironment,
  createAppBuilderClient,
  validateS3Config,
  createS3Client,
};
