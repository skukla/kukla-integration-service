/**
 * Shared File Infrastructure - Presigned URLs
 * @module shared/files/presigned-urls
 * @description Cross-domain presigned URL generation utilities
 */

const { selectStorageStrategy } = require('../../../files/shared/storage-strategies');
const { response } = require('../../http/responses');

/**
 * Generate presigned URL for system access
 * Used by: Cross-domain workflows requiring file URL generation
 * @param {string} fileName - File name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [options={}] - URL options
 * @returns {Promise<Object>} Presigned URL response
 */
async function generateSystemPresignedUrl(fileName, config, params, options = {}) {
  try {
    const storage = await selectStorageStrategy(config.storage.provider, config, params);
    const systemOptions = {
      expiresIn: options.expiresIn || config.storage.presignedUrls.expiration.long,
      urlType: options.urlType || 'external',
      permissions: options.permissions || 'r',
      operation: 'download',
      useCase: options.useCase || 'system',
      ...options,
    };

    // Generate presigned URL using storage strategy
    const presignedUrl = await storage.generatePresignedUrl(fileName, systemOptions);

    return response.success(
      {
        downloadUrl: presignedUrl,
        fileName: fileName,
        expiresIn: systemOptions.expiresIn,
        urlType: systemOptions.urlType,
      },
      'Presigned URL generated successfully'
    );
  } catch (error) {
    return response.error(error, {
      feature: 'system-presigned-url',
      fileName,
      options,
    });
  }
}

module.exports = {
  generateSystemPresignedUrl,
};
