/**
 * Scripts Core File Operations
 * File I/O operations with side effects
 */

const fs = require('fs');

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
 * Write JSON object to file
 * @param {string} filePath - Path to output file
 * @param {Object} data - Data to write as JSON
 * @param {number} [indent] - JSON formatting indent
 */
function writeJsonFile(filePath, data, indent = 2) {
  const jsonString = JSON.stringify(data, null, indent);
  fs.writeFileSync(filePath, jsonString);
}

module.exports = {
  fileExists,
  readJsonFile,
  writeJsonFile,
};
