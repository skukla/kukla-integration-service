/**
 * Scripts Core File Utilities
 * Shared file operation functions used by all script domains
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read and parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} Parsed JSON object
 */
function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

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
  fileExists,
  readJsonFile,
  getFileExtension,
  getBasename,
  joinPath,
};
