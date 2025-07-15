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
          default: 3600, // 1 hour default expiration (in seconds)
          s3: 3600, // S3 presigned URL expiration (1 hour)
          appBuilder: 3600, // App Builder presigned URL expiration (1 hour)
          download: 1800, // Download URLs expiration (30 minutes)
          upload: 900, // Upload URLs expiration (15 minutes)
        },
        s3: {
          signatureVersion: 'v4', // AWS signature version
          useAccelerateEndpoint: false, // Use S3 Transfer Acceleration
          forcePathStyle: false, // Force path-style addressing
        },
        appBuilder: {
          fallbackToAction: true, // Fall back to action URL if presigned fails
          cacheEnabled: true, // Cache presigned URLs
          cacheTtl: 1800, // Cache TTL for presigned URLs (30 minutes)
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
