/**
 * Files Domain URL Building Utilities
 *
 * Domain-specific utilities for building file-related URLs.
 * Contains files domain logic for URL construction.
 */

const { buildRuntimeUrl } = require('../../core/routing/operations/runtime');

/**
 * Build download URL for a file
 * Domain-specific utility for consistent file download URLs.
 *
 * @param {string} fileName - Name of the file
 * @param {Object} config - Configuration object
 * @returns {string} Complete download URL
 */
function buildFileDownloadUrl(fileName, config) {
  return (
    buildRuntimeUrl('download-file', null, config) + `?fileName=${encodeURIComponent(fileName)}`
  );
}

module.exports = {
  buildFileDownloadUrl,
};
