/**
 * Common file formatting utilities
 * @module utils/shared/file/format
 */

/**
 * Removes the public directory prefix from a file path
 * @param {string} filePath - File path that may contain 'public/' prefix
 * @returns {string} File path without the public prefix
 */
function removePublicPrefix(filePath) {
    return filePath.replace('public/', '');
}

/**
 * Formats a date to a localized string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatFileDate(date) {
    return new Date(date).toLocaleString();
}

module.exports = {
    removePublicPrefix,
    formatFileDate
}; 