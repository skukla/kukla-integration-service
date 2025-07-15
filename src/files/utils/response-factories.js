/**
 * Response Factory Utilities
 *
 * Standardized response creation for presigned URL operations.
 * Eliminates duplication of response structures across functions.
 */

const { createExpirationInfo } = require('./expiration');
const { createError } = require('../../core/utils/operations/errors');

/**
 * Create successful presigned URL response
 * Standardized success response factory for presigned URL operations.
 *
 * @param {string} presignedUrl - The generated presigned URL
 * @param {string} provider - Storage provider name (s3, app-builder)
 * @param {string} operation - Operation type (download, upload)
 * @param {number} expiresIn - Expiration duration in seconds
 * @param {Object} additionalFields - Provider-specific additional fields
 * @returns {Object} Standardized success response
 */
function createPresignedUrlSuccessResponse(
  presignedUrl,
  provider,
  operation,
  expiresIn,
  additionalFields = {}
) {
  const expirationInfo = createExpirationInfo(expiresIn);

  return {
    success: true,
    presignedUrl,
    provider,
    operation,
    ...expirationInfo,
    ...additionalFields,
  };
}

/**
 * Create failed presigned URL response
 * Standardized error response factory for presigned URL operations.
 *
 * @param {string} errorMessage - Error message
 * @param {string} errorCode - Error code for categorization
 * @param {string} operation - Operation type that failed
 * @param {Object} additionalContext - Additional error context
 * @returns {Object} Standardized error response
 */
function createPresignedUrlErrorResponse(
  errorMessage,
  errorCode,
  operation,
  additionalContext = {}
) {
  return {
    success: false,
    error: createError(errorMessage, errorCode, { operation, ...additionalContext }),
  };
}

/**
 * Create S3-specific presigned URL success response
 * Specialized factory for S3 responses with bucket and key info.
 *
 * @param {string} presignedUrl - The generated S3 presigned URL
 * @param {string} operation - Operation type
 * @param {number} expiresIn - Expiration duration in seconds
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Object} S3-specific success response
 */
function createS3PresignedUrlResponse(presignedUrl, operation, expiresIn, bucket, key) {
  return createPresignedUrlSuccessResponse(presignedUrl, 's3', operation, expiresIn, {
    bucket,
    key,
  });
}

/**
 * Create App Builder-specific presigned URL success response
 * Specialized factory for App Builder responses.
 *
 * @param {string} presignedUrl - The generated presigned URL
 * @param {string} operation - Operation type
 * @param {number} expiresIn - Expiration duration in seconds
 * @param {string} fileName - Full file name/path
 * @returns {Object} App Builder-specific success response
 */
function createAppBuilderPresignedUrlResponse(presignedUrl, operation, expiresIn, fileName) {
  return createPresignedUrlSuccessResponse(presignedUrl, 'app-builder', operation, expiresIn, {
    fileName,
  });
}

module.exports = {
  createPresignedUrlSuccessResponse,
  createPresignedUrlErrorResponse,
  createS3PresignedUrlResponse,
  createAppBuilderPresignedUrlResponse,
};
