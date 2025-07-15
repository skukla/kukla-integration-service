/**
 * Presigned URL Provider Utilities
 *
 * Low-level provider-specific utilities for generating presigned URLs.
 * Contains provider-specific SDK calls and configuration.
 */

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Generate S3 presigned URL using AWS SDK
 * Provider-specific utility for S3 presigned URL generation.
 *
 * @param {Object} s3Client - S3 client instance
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} Presigned URL
 */
async function createS3PresignedUrl(s3Client, bucket, key, expiresIn) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn,
    signableHeaders: new Set(['host']),
  });
}

/**
 * Check if App Builder Files SDK supports presigned URLs
 * Provider-specific utility to check native presigned URL support.
 *
 * @param {Object} files - Files client instance
 * @returns {boolean} True if presigned URLs are supported
 */
function supportsPresignedUrls(files) {
  return typeof files.generatePresignURL === 'function';
}

/**
 * Generate App Builder presigned URL using Files SDK
 * Provider-specific utility for App Builder presigned URL generation.
 *
 * @param {Object} files - Files client instance
 * @param {string} fullFileName - Full file path
 * @param {number} expiresIn - Expiration time in seconds
 * @param {Object} [options] - Additional options
 * @param {string} [options.urlType] - URL type: 'external' (CDN) or 'internal' (direct storage)
 * @param {string} [options.permissions] - Permissions: 'r', 'rw', 'rwd'
 * @returns {Promise<string>} Presigned URL
 */
async function createAppBuilderPresignedUrl(files, fullFileName, expiresIn, options = {}) {
  if (!supportsPresignedUrls(files)) {
    throw new Error('App Builder Files SDK does not support presigned URLs');
  }

  const { urlType = 'external', permissions = 'r' } = options;

  return await files.generatePresignURL(fullFileName, {
    expiryInSeconds: expiresIn,
    permissions,
    urltype: urlType,
  });
}

module.exports = {
  createS3PresignedUrl,
  createAppBuilderPresignedUrl,
  supportsPresignedUrls,
};
