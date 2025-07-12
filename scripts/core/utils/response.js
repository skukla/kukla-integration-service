/**
 * Scripts Core Response Utilities
 * Pure response validation and formatting functions
 */

/**
 * Determine if HTTP response indicates success
 * @param {Object} response - HTTP response object
 * @returns {boolean} True if successful response
 */
function isSuccessfulResponse(response) {
  return response.status >= 200 && response.status < 300;
}

/**
 * Format storage information for display
 * @param {Object} storage - Storage object from response
 * @returns {string} Formatted storage information
 */
function formatStorageInfo(storage) {
  const { provider, properties } = storage;

  if (!provider) {
    return 'Unknown Storage';
  }

  let info;
  if (provider === 'app-builder') {
    info = 'App Builder (Adobe I/O Files)';
  } else if (provider === 's3') {
    info = 'Amazon S3';
    if (properties?.bucket) {
      info += ` (${properties.bucket})`;
    }
  } else if (provider === 'error') {
    info = 'Storage Failed';
  } else {
    info = provider.toUpperCase();
  }

  return info;
}

/**
 * Extract error message from response
 * @param {Object} response - HTTP response object
 * @returns {string} Error message
 */
function extractErrorMessage(response) {
  if (response.body?.error) {
    return response.body.error;
  }
  return response.statusText || 'Unknown error';
}

module.exports = {
  isSuccessfulResponse,
  formatStorageInfo,
  extractErrorMessage,
};
