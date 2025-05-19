/**
 * URL utilities for the get-products action
 * @module utils/url/download
 */

/**
 * Constructs a download URL for a file
 * @param {string} fileName - Name of the file to download
 * @returns {string} Fully qualified download URL for accessing the file through the download-file action
 * @example
 * const url = getDownloadUrl('products.csv');
 * // Returns: https://{namespace}.adobeio-static.net/api/v1/web/{package}/download-file?fileName=products.csv
 */
function getDownloadUrl(fileName) {
  const namespace = process.env.__OW_NAMESPACE;
  const package = 'kukla-integration-service';
  const baseUrl = `https://${namespace}.adobeio-static.net/api/v1/web/${package}/download-file`;
  return `${baseUrl}?fileName=${encodeURIComponent(fileName)}`;
}

module.exports = {
  getDownloadUrl
}; 