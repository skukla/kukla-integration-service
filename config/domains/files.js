/**
 * Files Domain Configuration
 * @module config/domains/files
 *
 * 🎯 Used by: File operations (browse, download, delete), CSV export
 * ⚙️ Key settings: Storage providers, file naming, caching
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
      },
    },
    categories: {
      cacheTimeout: 1800, // 30 minutes
    },
  };
}

module.exports = {
  buildFilesConfig,
};
