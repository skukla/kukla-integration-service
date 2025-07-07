/**
 * Storage Path Utilities
 * @module files/paths
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

/**
 * Validates that a path is safe for file operations
 * @param {string} path - Path to validate
 * @returns {boolean} True if path is safe
 */
function isPathSafe(path) {
  if (!path || typeof path !== 'string') return false;

  // Check for path traversal attempts
  if (path.includes('..')) return false;

  // Check for null bytes (security risk)
  if (path.includes('\0')) return false;

  // Check for absolute paths (should be relative)
  if (path.startsWith('/')) return false;

  return true;
}

/**
 * Joins path segments safely
 * @param {...string} segments - Path segments to join
 * @returns {string} Joined path
 */
function joinPaths(...segments) {
  return segments
    .filter(Boolean)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .join('/');
}

/**
 * Gets the directory portion of a path
 * @param {string} path - File path
 * @returns {string} Directory path
 */
function getDirectory(path) {
  if (!path || typeof path !== 'string') return '';

  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return '';

  return path.substring(0, lastSlash);
}

/**
 * Gets the filename portion of a path
 * @param {string} path - File path
 * @returns {string} Filename
 */
function getFilename(path) {
  if (!path || typeof path !== 'string') return '';

  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return path;

  return path.substring(lastSlash + 1);
}

/**
 * Gets the file extension from a path
 * @param {string} path - File path
 * @returns {string} File extension (without dot)
 */
function getExtension(path) {
  const filename = getFilename(path);
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1 || lastDot === 0) return '';

  return filename.substring(lastDot + 1);
}

/**
 * Changes the extension of a file path
 * @param {string} path - Original file path
 * @param {string} newExtension - New extension (without dot)
 * @returns {string} Path with new extension
 */
function changeExtension(path, newExtension) {
  const dir = getDirectory(path);
  const filename = getFilename(path);
  const lastDot = filename.lastIndexOf('.');

  let baseName = filename;
  if (lastDot !== -1) {
    baseName = filename.substring(0, lastDot);
  }

  const newFilename = newExtension ? `${baseName}.${newExtension}` : baseName;

  return dir ? joinPaths(dir, newFilename) : newFilename;
}

module.exports = {
  extractCleanFilename,
  addPublicPrefix,
  normalizePath,
  isPathSafe,
  joinPaths,
  getDirectory,
  getFilename,
  getExtension,
  changeExtension,
};
