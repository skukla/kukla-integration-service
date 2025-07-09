/**
 * Files Domain Configuration
 * @module config/domains/files
 *
 * 🎯 Used by: File operations (browse, download, delete), CSV export
 * ⚙️ Key settings: Storage providers, file naming, caching, processing
 */

/**
 * Build files and storage configuration
 * @param {Object} params - Action parameters
 * @returns {Object} Files configuration
 */
function buildFilesConfig(params = {}) {
  const storageProvider = params.STORAGE_PROVIDER || process.env.STORAGE_PROVIDER || 's3';

  return {
    storage: {
      provider: storageProvider,
      csv: {
        filename: 'products.csv',
        chunkSize: 8192,
        compressionLevel: 6,
        streamBufferSize: 16384,
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
      minCompressionSize: 1024, // 1KB
      binaryThreshold: 1024,
    },
    caching: {
      categoryTimeout: 1800, // 30 minutes
      fileListTimeout: 300, // 5 minutes
    },
  };
}

module.exports = {
  buildFilesConfig,
};
