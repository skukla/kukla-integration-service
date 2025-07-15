/**
 * Access Pattern Utilities
 *
 * Utilities for determining the appropriate file access method
 * based on use case and configuration (dual access pattern).
 */

const { buildFileDownloadUrl } = require('./url-building');
const { generateSystemPresignedUrl } = require('../workflows/file-management');

/**
 * Get access method for a specific use case
 * @param {string} useCase - Use case ('user', 'adobeTarget', 'salesforce', etc.)
 * @param {Object} config - Configuration object
 * @returns {Object} Access method configuration
 */
function getAccessMethod(useCase, config) {
  const { patterns, fallback } = config.storage.presignedUrls.dualAccess;

  // Get pattern for use case, fallback to default pattern if not specified
  const pattern = patterns[useCase] || fallback;

  return {
    method: pattern.method,
    reason: pattern.reason,
    urlType: pattern.urlType || 'action', // Default to action for download-action method
    useCase,
    expiresIn: pattern.expiresIn, // Only used for presigned URLs
  };
}

/**
 * Generate action-based download URL
 * @param {string} fileName - Name of the file
 * @param {string} useCase - Use case
 * @param {Object} config - Configuration object
 * @param {Object} accessMethod - Access method configuration
 * @returns {Object} Action URL response
 */
function generateActionUrl(fileName, useCase, config, accessMethod) {
  const actionUrl = buildFileDownloadUrl(fileName, config);
  return {
    success: true,
    url: actionUrl,
    method: 'download-action',
    urlType: 'action',
    useCase,
    reason: accessMethod.reason,
    expiresAt: null, // Action URLs don't expire
    metadata: {
      fileName,
      method: 'download-action',
      generatedAt: new Date().toISOString(),
      reliable: true,
      crossBrowser: true,
    },
  };
}

/**
 * Generate appropriate file access URL based on use case
 * Implements dual access pattern: action URLs for users, presigned URLs for systems
 *
 * @param {string} fileName - Name of the file
 * @param {string} useCase - Use case: 'user', 'system', 'api', 'internal'
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [options] - Additional options for presigned URL generation
 * @returns {Promise<Object>} Access URL response
 */
async function generateFileAccessUrl(fileName, useCase, config, params, options = {}) {
  const accessMethod = getAccessMethod(useCase, config);

  try {
    switch (accessMethod.method) {
      case 'download-action': {
        return generateActionUrl(fileName, useCase, config, accessMethod);
      }

      case 'presigned-url': {
        // Generate presigned URL for systems/APIs using fallback configuration
        const presignedOptions = {
          urlType: accessMethod.urlType,
          useCase,
          expiresIn: accessMethod.expiresIn, // Use expiration from pattern/fallback
          ...options,
        };

        const presignedResult = await generateSystemPresignedUrl(
          fileName,
          config,
          params,
          presignedOptions
        );

        if (!presignedResult.success) {
          throw new Error(`Presigned URL generation failed: ${presignedResult.error.message}`);
        }

        return {
          success: true,
          url: presignedResult.presignedUrl,
          method: 'presigned-url',
          urlType: presignedResult.urlType,
          useCase,
          reason: accessMethod.reason,
          expiresAt: presignedResult.expiresAt,
          expiresIn: presignedResult.expiresIn,
          permissions: presignedResult.permissions,
          metadata: presignedResult.metadata,
        };
      }

      default: {
        throw new Error(`Unknown access method: ${accessMethod.method}`);
      }
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'ACCESS_URL_GENERATION_ERROR',
        useCase,
        requestedMethod: accessMethod.method,
      },
    };
  }
}

/**
 * Get access recommendations for different use cases
 * @param {Object} config - Configuration object
 * @returns {Object} Access recommendations by use case
 */
function getAccessRecommendations(config) {
  const patterns = config.storage.presignedUrls.dualAccess.patterns;

  return Object.entries(patterns).reduce((recommendations, [useCase, pattern]) => {
    recommendations[useCase] = {
      method: pattern.method,
      reason: pattern.reason,
      urlType: config.storage.presignedUrls.dualAccess.defaultUrlType[useCase] || 'external',
    };
    return recommendations;
  }, {});
}

module.exports = {
  getAccessMethod,
  generateFileAccessUrl,
  generateActionUrl,
  getAccessRecommendations,
};
