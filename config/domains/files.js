/**
 * Files Domain Configuration
 * @module config/domains/files
 *
 * Used by: File operations (browse, download, delete), CSV export
 * ⚙️ Key settings: File processing, extensions, content types, technical file handling
 */

/**
 * Build files and storage configuration
 * @param {Object} [params] - Action parameters (unused)
 * @param {Object} [mainConfig] - Shared main configuration (for CSV filename and storage directory)
 * @returns {Object} Files configuration
 */
function buildFilesConfig(params = {}, mainConfig = {}) {
  // eslint-disable-next-line no-unused-vars
  params; // Keep for interface consistency

  return buildFilesConfiguration(mainConfig);
}

/**
 * Build complete files configuration object
 * @param {Object} mainConfig - Shared main configuration
 * @returns {Object} Files configuration
 */
function buildFilesConfiguration(mainConfig) {
  return {
    storage: {
      csv: {
        filename: mainConfig.csvFilename, // Shared from main
        chunkSize: 8192, // Technical setting
        compressionLevel: 6, // Technical setting
        streamBufferSize: 16384, // Technical setting
      },
      directory: mainConfig.storage.directory, // Shared from main (business setting)
      presignedUrls: {
        enabled: true, // Enable presigned URL generation
        expiration: {
          short: 1800, // 30 minutes for downloads and temporary access
          long: 3600, // 1 hour for uploads and extended access (legacy)
          adobeTarget: 172800, // 48 hours (2 days) for Adobe Target integration
          maximum: 604800, // 7 days - AWS S3 maximum expiration time
        },
        s3: {
          signatureVersion: 'v4', // AWS signature version
        },
        dualAccess: {
          // Define access patterns for different use cases
          patterns: {
            user: {
              method: 'download-action', // Always use download-file action for users
              reason: 'Reliable access, consistent availability, works across all browsers',
            },
            adobeTarget: {
              method: 'presigned-url', // Adobe Target REQUIRES presigned URLs - cannot use action URLs
              reason: 'Adobe Target technical constraint - only supports presigned URL access',
              urlType: 'external', // CDN-based for optimal performance
              expiresIn: 604800, // 7 days - maximum AWS S3 allows (weekly manual updates required)
            },
            // Future systems can be added here with specific configurations
            // salesforce: { method: 'presigned-url', reason: '...' },
            // hubspot: { method: 'download-action', reason: '...' },
          },
          // Default to presigned URLs for any unspecified integrations
          fallback: {
            method: 'presigned-url',
            reason: 'Direct access for external integrations with programmatic URL updates',
            urlType: 'external',
            expiresIn: 172800, // 48 hours default
          },
        },
      },
    },

    extensions: {
      csv: '.csv',
      json: '.json',
      log: '.log',
    },

    contentTypes: {
      csv: 'text/csv',
      json: 'application/json',
      binary: 'application/octet-stream',
    },

    processing: {
      minCompressionSize: 1024, // 1KB threshold
      binaryThreshold: 1024, // Binary detection threshold
      fileListTimeout: 300, // 5 minutes (technical setting)
    },
  };
}

module.exports = {
  buildFilesConfig,
};
