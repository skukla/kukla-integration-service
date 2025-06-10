/**
 * Core utilities for Adobe App Builder actions
 * @module src/core/utils
 */

/**
 * Format step message for consistent logging across all actions
 * @param {string} name - Step name
 * @param {string} status - Step status or description
 * @param {Object} details - Optional details object
 * @returns {string} Formatted step message
 */
function formatStepMessage(name, status, details = {}) {
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
