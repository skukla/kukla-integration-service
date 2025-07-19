/**
 * URL Factory
 * Pre-configured URL builders that eliminate config repetition
 */

const { buildCommerceApiUrl } = require('./commerce');
const { buildActionUrl } = require('./runtime');

/**
 * Create pre-configured URL builders
 * @purpose Create URL builders with config pre-bound to eliminate repetition
 * @param {Object} config - Configuration object (passed once)
 * @returns {Object} Pre-configured URL builder functions
 * @usedBy All domains requiring URL building
 *
 * Usage:
 *   const { downloadUrl, commerceUrl, testUrl } = createUrlBuilders(config);
 *   const url = downloadUrl(fileName);  // No config needed!
 */
function createUrlBuilders(config) {
  return {
    /**
     * File download URL builder
     * @param {string} fileName - File name to download
     * @param {Object} [options] - Additional URL options
     * @returns {string} Download URL
     */
    downloadUrl(fileName, options = {}) {
      return buildActionUrl(config, 'download-file', {
        absolute: true,
        params: { fileName },
        ...options,
      });
    },

    /**
     * File deletion URL builder
     * @param {string} fileName - File name to delete
     * @param {Object} [options] - Additional URL options
     * @returns {string} Delete URL
     */
    deleteUrl(fileName, options = {}) {
      return buildActionUrl(config, 'delete-file', {
        absolute: true,
        params: { fileName },
        ...options,
      });
    },

    /**
     * File browser URL builder
     * @param {Object} [options] - Additional URL options
     * @returns {string} Browse URL
     */
    browseUrl(options = {}) {
      return buildActionUrl(config, 'browse-files', {
        absolute: true,
        ...options,
      });
    },

    /**
     * Commerce API URL builder
     * @param {string} endpoint - Commerce endpoint (products, categories, inventory, etc.)
     * @param {Object} [params] - Query parameters or path parameters
     * @param {Object} [pathParams] - Path replacement parameters
     * @returns {string} Commerce API URL
     */
    commerceUrl(endpoint, params = {}, pathParams = {}) {
      // Handle complex endpoint building (like products with query params)
      if (endpoint === 'products' && Object.keys(params).length > 0) {
        const { buildProductsEndpoint } = require('../../commerce/shared/endpoint-builders');
        return buildProductsEndpoint(params, config);
      }

      // Handle simple endpoints
      return buildCommerceApiUrl(endpoint, config, pathParams);
    },

    /**
     * Runtime action URL builder
     * @param {string} action - Action name
     * @param {Object} [params] - URL parameters
     * @param {Object} [options] - Additional URL options
     * @returns {string} Runtime action URL
     */
    runtimeUrl(action, params = {}, options = {}) {
      return buildActionUrl(config, action, {
        absolute: true,
        params,
        ...options,
      });
    },

    /**
     * Testing URL builder
     * @param {string} endpoint - Test endpoint
     * @param {Object} [params] - URL parameters
     * @returns {string} Test URL
     */
    testUrl(endpoint, params = {}) {
      // For testing, we typically want to test commerce endpoints
      return buildCommerceApiUrl(endpoint, config, params);
    },

    /**
     * Upload URL builder (future functionality)
     * @param {Object} [options] - Upload options
     * @returns {string} Upload URL
     */
    uploadUrl(options = {}) {
      return buildActionUrl(config, 'upload-file', {
        absolute: true,
        ...options,
      });
    },
  };
}

module.exports = {
  createUrlBuilders,
};
