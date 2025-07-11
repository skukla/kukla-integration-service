/**
 * Scripts Core Path Utilities
 * Pure path manipulation functions with no I/O side effects
 */

const path = require('path');

/**
 * Get file extension
 * @param {string} filePath - Path to file
 * @returns {string} File extension (including dot)
 */
function getFileExtension(filePath) {
  return path.extname(filePath);
}

/**
 * Get basename of file (filename without extension)
 * @param {string} filePath - Path to file
 * @returns {string} Basename
 */
function getBasename(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Join path components
 * @param {...string} paths - Path components
 * @returns {string} Joined path
 */
function joinPath(...paths) {
  return path.join(...paths);
}

module.exports = {
  getFileExtension,
  getBasename,
  joinPath,
};
