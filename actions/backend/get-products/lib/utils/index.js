/**
 * Utility functions for get-products action
 */

/**
 * Format a file name with timestamp
 * @param {string} prefix - Prefix for the file name
 * @param {string} extension - File extension
 * @returns {string} Formatted file name
 */
function formatFileName(prefix, extension) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Validate file format
 * @param {string} format - File format to validate
 * @returns {boolean} Whether the format is valid
 */
function isValidFileFormat(format) {
  return ['csv', 'json'].includes(format.toLowerCase());
}

module.exports = {
  formatFileName,
  isValidFileFormat,
}; 