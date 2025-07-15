/**
 * Presigned URL Operations
 *
 * Mid-level business logic for generating presigned URLs for file access.
 * Contains operations that create publicly accessible URLs with expiration times.
 */

const { buildStorageFilePath } = require('../utils/paths');
const {
  createS3PresignedUrl,
  createAppBuilderPresignedUrl,
  supportsPresignedUrls,
} = require('../utils/presigned-url-providers');
const {
  createS3PresignedUrlResponse,
  createAppBuilderPresignedUrlResponse,
  createPresignedUrlErrorResponse,
} = require('../utils/response-factories');

/**
 * Generate S3 presigned URL for file access
 * Business operation that creates a time-limited public URL for S3 files.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {Object} s3Config - S3 configuration
 * @param {string} fileName - Name of the file
 * @param {Object} config - Full configuration object
 * @param {Object} [options] - Presigned URL options
 * @param {number} [options.expiresIn] - Expiration time in seconds
 * @param {string} [options.operation] - Operation type (download, upload)
 * @returns {Promise<Object>} Presigned URL result with expiration info
 */
async function generateS3PresignedUrl(s3Client, s3Config, fileName, config, options = {}) {
  const { expiresIn = config.storage.presignedUrls.expiration.short, operation = 'download' } =
    options;

  try {
    // Build the full S3 key path using utility
    const storageDirectory = config.storage.directory || '';
    const fullPath = buildStorageFilePath(fileName, storageDirectory, s3Config.prefix);

    // Generate presigned URL using utility
    const presignedUrl = await createS3PresignedUrl(s3Client, s3Config.bucket, fullPath, expiresIn);

    // Create standardized S3 response
    return createS3PresignedUrlResponse(
      presignedUrl,
      operation,
      expiresIn,
      s3Config.bucket,
      fullPath
    );
  } catch (error) {
    return createPresignedUrlErrorResponse(
      `S3 presigned URL generation failed: ${error.message}`,
      'S3_PRESIGNED_URL_ERROR',
      operation
    );
  }
}

/**
 * Generate App Builder presigned URL for file access
 * Business operation that creates a time-limited public URL for App Builder files.
 *
 * @param {Object} files - Files client instance
 * @param {string} fileName - Name of the file
 * @param {Object} config - Full configuration object
 * @param {Object} [options] - Presigned URL options
 * @param {number} [options.expiresIn] - Expiration time in seconds
 * @param {string} [options.operation] - Operation type (download, upload)
 * @param {string} [options.urlType] - URL type: 'external' (CDN) or 'internal' (direct storage)
 * @param {string} [options.permissions] - Permissions: 'r', 'rw', 'rwd'
 * @returns {Promise<Object>} Presigned URL result with expiration info
 */
async function generateAppBuilderPresignedUrl(files, fileName, config, options = {}) {
  const {
    expiresIn = config.storage.presignedUrls.expiration.short,
    operation = 'download',
    urlType = 'external',
    permissions = 'r',
  } = options;

  try {
    // Check if the files SDK supports presigned URLs
    if (!supportsPresignedUrls(files)) {
      throw new Error('App Builder Files SDK does not support presigned URLs');
    }

    const storageDirectory = config.storage.directory;
    const fullFileName = buildStorageFilePath(fileName, storageDirectory);

    // Generate presigned URL using native SDK method
    const presignedUrl = await createAppBuilderPresignedUrl(files, fullFileName, expiresIn, {
      urlType,
      permissions,
    });

    // Create standardized App Builder response
    return createAppBuilderPresignedUrlResponse(presignedUrl, operation, expiresIn, fullFileName);
  } catch (error) {
    return createPresignedUrlErrorResponse(
      `App Builder presigned URL generation failed: ${error.message}`,
      'APP_BUILDER_PRESIGNED_URL_ERROR',
      operation
    );
  }
}

/**
 * Generate presigned URL for any storage provider
 * High-level business operation that delegates to provider-specific implementations.
 *
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file
 * @param {Object} config - Full configuration object
 * @param {Object} [options] - Presigned URL options
 * @returns {Promise<Object>} Presigned URL result
 */
async function generatePresignedUrl(storage, fileName, config, options = {}) {
  if (!config.storage.presignedUrls.enabled) {
    return {
      success: false,
      error: {
        message: 'Presigned URLs are disabled in configuration',
        type: 'PRESIGNED_URL_DISABLED',
      },
    };
  }

  switch (storage.provider) {
    case 's3':
      return await generateS3PresignedUrl(
        storage.client,
        { bucket: storage.bucket, prefix: storage.prefix },
        fileName,
        config,
        options
      );

    case 'app-builder':
      return await generateAppBuilderPresignedUrl(storage.client, fileName, config, options);

    default:
      return {
        success: false,
        error: {
          message: `Presigned URLs not supported for provider: ${storage.provider}`,
          type: 'UNSUPPORTED_PROVIDER',
        },
      };
  }
}

/**
 * Validate presigned URL expiration
 * Utility operation to check if a presigned URL is still valid.
 *
 * @param {string} expiresAt - ISO timestamp of expiration
 * @returns {Object} Validation result
 */
function validatePresignedUrlExpiration(expiresAt) {
  const { validateExpiration } = require('../utils/expiration');
  return validateExpiration(expiresAt);
}

module.exports = {
  generateS3PresignedUrl,
  generateAppBuilderPresignedUrl,
  generatePresignedUrl,
  validatePresignedUrlExpiration,
};
