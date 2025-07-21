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
 * Build presigned URL configuration
 * @returns {Object} Presigned URL configuration
 */
function buildPresignedUrlConfig() {
  return {
    enabled: true, // Enable presigned URL generation
  };
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
      presignedUrls: buildPresignedUrlConfig(),
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

    // MIME type mapping for file downloads
    mimeTypes: {
      csv: 'text/csv',
      json: 'application/json',
      log: 'text/plain',
    },

    // File deletion security settings
    allowedDeletions: ['*.csv', '*.json', '*.log'],

    protectedPatterns: ['system', 'config', '.env'],

    processing: {
      minCompressionSize: 1024,
      binaryThreshold: 1024,
      fileListTimeout: 300,
    },
  };
}

module.exports = {
  buildFilesConfig,
};
