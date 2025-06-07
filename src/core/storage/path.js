/**
 * Storage path utilities
 * @module core/storage/path
 * @description Utilities for handling storage paths and filename transformations
 */

/**
 * Extract clean filename from path (remove public/ prefix if present)
 * @param {string} fileName - File name or path
 * @returns {string} Clean filename without prefix
 * @description This handles the common case where storage systems use a public/ prefix
 * for organization, but file operations need the clean filename
 */
function extractCleanFilename(fileName) {
  if (!fileName) return fileName;
  // Remove public/ prefix if present
  return fileName.replace(/^public\//, '');
}

/**
 * Add public prefix to filename if not already present
 * @param {string} fileName - File name
 * @returns {string} Filename with public/ prefix
 */
function addPublicPrefix(fileName) {
  if (!fileName) return fileName;
  if (fileName.startsWith('public/')) return fileName;
  return `public/${fileName}`;
}

/**
 * Normalize storage path - ensures consistent path format
 * @param {string} path - Storage path
 * @returns {string} Normalized path
 */
function normalizePath(path) {
  if (!path) return path;
  // Remove leading/trailing slashes and normalize separators
  return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

module.exports = {
  extractCleanFilename,
  addPublicPrefix,
  normalizePath,
};
