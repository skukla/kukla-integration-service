/**
 * Core utilities for Adobe App Builder actions
 * @module src/core/utils
 */

/**
 * Format step message with detailed, human-readable descriptions
 * @param {string} name - Step name
 * @param {string} status - Step status or description
 * @param {Object} details - Optional details object
 * @returns {string} Formatted step message
 */
function formatStepMessage(name, status, details = {}) {
  const stepMessages = {
    'extract-params': {
      success: 'Successfully extracted and validated action parameters',
      error: 'Failed to extract action parameters',
    },
    'validate-input': {
      success: 'Successfully validated Commerce API credentials and URL',
      error: 'Failed to validate input parameters',
    },
    'validate-mesh': {
      success: 'Successfully validated API Mesh configuration and credentials',
      error: 'Failed to validate mesh configuration',
    },
    'fetch-and-enrich': {
      success: (count) =>
        `Successfully fetched and enriched ${count} products with category and inventory data`,
      error: 'Failed to fetch products from Commerce API',
    },
    'fetch-mesh': {
      success: (count) =>
        `Successfully fetched and enriched ${count} products with category and inventory data`,
      error: 'Failed to fetch products from API Mesh',
    },
    'build-products': {
      success: (count) => `Successfully transformed ${count} products for export`,
      error: 'Failed to transform product data',
    },
    'create-csv': {
      success: (size) => `Successfully generated CSV file (${formatFileSize(size)})`,
      error: 'Failed to generate CSV file',
    },
    'store-csv': {
      success: (info) => {
        if (typeof info === 'object' && info.fileName && info.properties) {
          const size = parseInt(info.properties.size) || info.properties.size;
          const formattedSize = typeof size === 'number' ? formatFileSize(size) : size;
          return `Successfully stored CSV file as ${info.fileName} (${formattedSize})`;
        }
        return 'Successfully stored CSV file';
      },
      error: 'Failed to store CSV file',
    },
  };

  const stepMessage = stepMessages[name];
  if (stepMessage) {
    return status === 'success'
      ? typeof stepMessage[status] === 'function'
        ? stepMessage[status](details.count || details.size || details.info)
        : stepMessage[status]
      : `${stepMessage[status]}: ${details.error || ''}`;
  }

  // Fallback to generic format for unknown steps
  const detailsStr =
    Object.keys(details).length > 0
      ? ` (${Object.entries(details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')})`
      : '';
  return `${name}: ${status}${detailsStr}`;
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
function createError(message, code = 'UNKNOWN_ERROR', details = {}) {
  return {
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  formatStepMessage,
  formatFileSize,
  createError,
  sleep,
};
