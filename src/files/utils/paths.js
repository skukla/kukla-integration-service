/**
 * Storage Path Utilities
 * @module files/paths
 * @description Utilities for handling storage paths and filename transformations
 */

/**
 * Extract clean filename from path (remove storage directory prefix if present)
 * @param {string} fileName - File name or path
 * @param {string} [storageDirectory='public/'] - Storage directory prefix to remove
 * @returns {string} Clean filename without directory prefix
 * @description This handles the common case where storage systems use a directory prefix
 */
function removePublicPrefix(fileName, storageDirectory = 'public/') {
  if (!fileName) return fileName;

  // Remove storage directory prefix if present
  return fileName.replace(new RegExp(`^${storageDirectory.replace('/', '\\/')}`), '');
}

/**
 * Build storage file path with proper concatenation
 * Eliminates duplication of path building logic across the files domain.
 *
 * @param {string} fileName - Base filename
 * @param {string} storageDirectory - Storage directory path
 * @param {string} [prefix] - Optional prefix (for S3)
 * @returns {string} Complete file path
 */
function buildStorageFilePath(fileName, storageDirectory, prefix = '') {
  const directory = storageDirectory || '';

  if (prefix) {
    return `${prefix}${directory}${fileName}`;
  }

  return `${directory}${fileName}`;
}

/**
 * Ensure file path starts with storage directory
 * Utility to handle both full paths and filename-only scenarios.
 *
 * @param {string} fileName - File name or path
 * @param {string} storageDirectory - Storage directory path
 * @returns {string} Full file path
 */
function ensureStorageDirectoryPath(fileName, storageDirectory) {
  if (fileName.startsWith(storageDirectory)) return fileName;
  return `${storageDirectory}${fileName}`;
}

/**
 * Add storage directory prefix to filename if not already present
 * @param {string} fileName - File name
 * @param {string} [storageDirectory='public/'] - Storage directory prefix to add
 * @returns {string} Filename with storage directory prefix
 */
function addPublicPrefix(fileName, storageDirectory = 'public/') {
  if (!fileName) return fileName;

  if (fileName.startsWith(storageDirectory)) return fileName;
  return `${storageDirectory}${fileName}`;
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
  removePublicPrefix,
  addPublicPrefix,
  normalizePath,
  isPathSafe,
  joinPaths,
  getDirectory,
  getFilename,
  getExtension,
  changeExtension,
  buildStorageFilePath,
  ensureStorageDirectoryPath,
};
