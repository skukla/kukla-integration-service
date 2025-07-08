/**
 * S3 Storage Operations
 *
 * Mid-level business logic for AWS S3 storage operations.
 * Contains S3-specific business operations and coordination.
 */

const { createS3StorageWrapper } = require('../utils/storage-factories');
const { validateS3Config, createS3Client } = require('../utils/validation');

/**
 * Initialize AWS S3 storage
 * Business operation that coordinates S3 storage setup.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Storage client wrapper
 * @throws {Error} If S3 configuration validation fails
 */
async function initializeS3Storage(config, params = {}) {
  const { s3Config, accessKeyId, secretAccessKey } = validateS3Config(config, params);
  const s3Client = createS3Client(s3Config, accessKeyId, secretAccessKey);
  return createS3StorageWrapper(s3Client, s3Config, config);
}

module.exports = {
  initializeS3Storage,
};
