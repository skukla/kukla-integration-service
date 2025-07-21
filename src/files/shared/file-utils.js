/**
 * Files Shared File Utilities
 * File manipulation functions shared across 3+ features in the files domain
 *
 * Consolidated from file-download.js, file-deletion/validation.js, and other file features
 */

/**
 * Clean and sanitize file name for safe file operations
 * @purpose Remove unsafe characters and normalize file names for storage operations
 * @param {string} fileName - Original file name to clean
 * @param {Object} config - Configuration object with file settings
 * @returns {string} Cleaned and safe file name
 * @usedBy file-download, file-deletion, file-browser (3+ features)
 */
function cleanFileName(fileName, config) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  // Remove public prefix if it exists
  const cleanedName = removePublicPrefix(fileName, config.storage?.directory);

  // Sanitize the file name
  return sanitizeFileName(cleanedName);
}

/**
 * Remove public directory prefix from file name
 * @purpose Strip public directory prefix for consistent file naming
 * @param {string} fileName - File name that may include public prefix
 * @param {string} publicDir - Public directory prefix to remove (e.g., 'public/')
 * @returns {string} File name without public prefix
 * @usedBy cleanFileName, file operations
 */
function removePublicPrefix(fileName, publicDir = 'public/') {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  if (fileName.startsWith(publicDir)) {
    return fileName.substring(publicDir.length);
  }

  return fileName;
}

/**
 * Sanitize file name by removing unsafe characters
 * @purpose Clean file name of characters that could cause issues in file systems
 * @param {string} fileName - File name to sanitize
 * @returns {string} Sanitized file name
 * @usedBy cleanFileName
 */
function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  // Remove or replace unsafe characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove unsafe characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .trim();
}

/**
 * Build safe file path for storage operations
 * @purpose Construct safe file paths for storage operations
 * @param {string} directory - Base directory
 * @param {string} fileName - File name to append
 * @returns {string} Safe file path
 * @usedBy Multiple file features for path construction
 */
function buildSafeFilePath(directory, fileName) {
  if (!directory || !fileName) {
    return fileName || '';
  }

  const cleanDir = directory.endsWith('/') ? directory : `${directory}/`;
  const cleanFile = cleanFileName(fileName, { storage: { directory: cleanDir } });

  return `${cleanDir}${cleanFile}`;
}

/**
 * Extract file name from a full path
 * @purpose Get just the file name portion from a full file path
 * @param {string} filePath - Full file path
 * @returns {string} File name portion
 * @usedBy File processing features
 */
function extractFileName(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }

  return filePath.split('/').pop() || '';
}

/**
 * Build storage parameters for file operations
 * @purpose Create complete storage parameters object for file storage operations
 * @param {string} fileName - Target filename for storage
 * @param {Object} config - Application configuration with storage settings
 * @param {Object} params - Additional parameters for storage configuration
 * @returns {Object} Complete storage parameters for strategy execution
 * @usedBy CSV export and other file storage operations
 */
function buildStorageParams(fileName, config, params) {
  const cleanedFileName = cleanFileName(fileName, config);

  return {
    fileName: cleanedFileName,
    provider: config.storage.provider,
    directory: config.storage.directory,
    timestamp: new Date().toISOString(),
    source: params.source || 'file-operation',
  };
}

module.exports = {
  // Business workflows
  buildStorageParams,

  // Feature operations
  cleanFileName,
  removePublicPrefix,
  sanitizeFileName,

  // Feature utilities
  buildSafeFilePath,
  extractFileName,
};
