/**
 * Shared file formatting utilities for actions
 * @module actions/shared/file/format
 */

/**
 * Removes the 'public/' prefix from a file path
 * @param {string} filePath - File path that may contain 'public/' prefix
 * @returns {string} File path without 'public/' prefix
 */
function removePublicPrefix(filePath) {
    return filePath.replace(/^public\//, '');
}

/**
 * Formats a date for file display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatFileDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

module.exports = {
    removePublicPrefix,
    formatFileDate
}; 