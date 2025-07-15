/**
 * Presigned URL Operations
 *
 * Mid-level business logic for generating presigned URLs for file access.
 * Contains operations that create publicly accessible URLs with expiration times.
 */

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { buildRuntimeUrl } = require('../../core/routing/operations/runtime');

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
  const { expiresIn = config.storage.presignedUrls.expiration.s3, operation = 'download' } =
    options;

  try {
    // Build the full S3 key path
    const storageDirectory = config.storage.directory || '';
    const fullPath = s3Config.prefix
      ? `${s3Config.prefix}${storageDirectory}${fileName}`
      : `${storageDirectory}${fileName}`;

    // Create the S3 command for the operation
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: fullPath,
    });

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
      signableHeaders: new Set(['host']),
    });

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      success: true,
      presignedUrl,
      expiresIn,
      expiresAt: expiresAt.toISOString(),
      provider: 's3',
      operation,
      bucket: s3Config.bucket,
      key: fullPath,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: `S3 presigned URL generation failed: ${error.message}`,
        type: 'S3_PRESIGNED_URL_ERROR',
        operation,
      },
    };
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
 * @returns {Promise<Object>} Presigned URL result with expiration info
 */
async function generateAppBuilderPresignedUrl(files, fileName, config, options = {}) {
  const { expiresIn = config.storage.presignedUrls.expiration.appBuilder, operation = 'download' } =
    options;

  try {
    // For App Builder, check if the files SDK supports presigned URLs
    // If not, fall back to action-based URL with expiration tracking
    const storageDirectory = config.storage.directory;
    const fullFileName = `${storageDirectory}${fileName}`;

    // Try to get presigned URL from Files SDK (if supported)
    let presignedUrl;
    let usedFallback = false;

    // Check if Files SDK has a presigned URL method
    if (typeof files.getPresignedUrl === 'function') {
      try {
        presignedUrl = await files.getPresignedUrl(fullFileName, { expiresIn });
      } catch (presignedError) {
        // Fall back to action URL if presigned URL generation fails
        usedFallback = true;
      }
    } else {
      // Files SDK doesn't support presigned URLs, use fallback
      usedFallback = true;
    }

    if (usedFallback && config.storage.presignedUrls.appBuilder.fallbackToAction) {
      // Generate action-based URL with expiration timestamp
      const actionUrl =
        buildRuntimeUrl('download-file', null, config) +
        `?fileName=${encodeURIComponent(fileName)}`;

      // Add expiration timestamp to the URL
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      presignedUrl = `${actionUrl}&expires=${expiresAt.getTime()}`;
    }

    if (!presignedUrl) {
      throw new Error('Unable to generate presigned URL and fallback is disabled');
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      success: true,
      presignedUrl,
      expiresIn,
      expiresAt: expiresAt.toISOString(),
      provider: 'app-builder',
      operation,
      fallbackUsed: usedFallback,
      fileName: fullFileName,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: `App Builder presigned URL generation failed: ${error.message}`,
        type: 'APP_BUILDER_PRESIGNED_URL_ERROR',
        operation,
      },
    };
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
        { bucket: storage.bucket, prefix: storage.prefix, region: config.storage.s3.region },
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
  const now = new Date();
  const expiration = new Date(expiresAt);
  const isExpired = now >= expiration;
  const timeRemaining = Math.max(0, expiration.getTime() - now.getTime());

  return {
    isExpired,
    timeRemaining, // milliseconds
    timeRemainingSeconds: Math.floor(timeRemaining / 1000),
    expiresAt,
  };
}

module.exports = {
  generateS3PresignedUrl,
  generateAppBuilderPresignedUrl,
  generatePresignedUrl,
  validatePresignedUrlExpiration,
};
