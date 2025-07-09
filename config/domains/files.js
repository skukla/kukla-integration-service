/**
 * Files Domain Configuration
 * @module config/domains/files
 *
 * 🎯 Used by: File operations (browse, download, delete), CSV export
 * ⚙️ Key settings: File naming, processing settings, technical file handling
 *
 * 📋 Shared settings: Uses main configuration for CSV filename and file caching
 */

/**
 * Build files and storage configuration
 * @param {Object} [params] - Action parameters (unused - kept for interface consistency)
 * @param {Object} [mainConfig] - Shared main configuration
 * @returns {Object} Files configuration
 */
function buildFilesConfig(params = {}, mainConfig = {}) {
  // Note: params parameter kept for consistent interface but not used
  // eslint-disable-next-line no-unused-vars
  params;

  return {
    storage: {
      // Note: Storage provider moved to main domain for centralized control
      csv: {
        filename: mainConfig.csvFilename || 'products.csv', // Shared from main
        chunkSize: 8192, // Technical: file processing setting
        compressionLevel: 6, // Technical: compression setting
        streamBufferSize: 16384, // Technical: stream setting
      },
    },

    // 🔧 TECHNICAL: File extension mappings
    extensions: {
      csv: '.csv',
      json: '.json',
      log: '.log',
    },

    // 🔧 TECHNICAL: Content type mappings
    contentTypes: {
      csv: 'text/csv',
      json: 'application/json',
      binary: 'application/octet-stream',
    },

    // 🔧 TECHNICAL: File processing settings
    processing: {
      minCompressionSize: 1024, // Technical: 1KB threshold
      binaryThreshold: 1024, // Technical: binary detection threshold
      fileListTimeout: mainConfig.cache?.fileListTimeout || 300, // Shared from main: 5 minutes
    },
  };
}

module.exports = {
  buildFilesConfig,
};
