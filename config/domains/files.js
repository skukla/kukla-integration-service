/**
 * Files Domain Configuration
 * @module config/domains/files
 *
 * 🎯 Used by: File operations (browse, download, delete), CSV export
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
        filename: mainConfig.csvFilename || 'products.csv', // Shared from main (business setting)
        chunkSize: 8192, // Technical setting
        compressionLevel: 6, // Technical setting
        streamBufferSize: 16384, // Technical setting
      },
      directory: mainConfig.storage?.directory || 'public/', // Shared from main (business setting)
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
