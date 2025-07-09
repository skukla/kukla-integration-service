/**
 * Scripts Core Hash Operations
 * Shared hash calculation functionality used by all script domains
 */

const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate SHA-256 hash of file contents
 * @param {string} filePath - Path to file
 * @returns {string} File hash
 */
function calculateFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate SHA-256 hash of object/configuration
 * @param {Object} obj - Object to hash
 * @returns {string} Object hash
 */
function calculateObjectHash(obj) {
  const objString = JSON.stringify(obj, null, 2);
  return crypto.createHash('sha256').update(objString).digest('hex');
}

module.exports = {
  calculateFileHash,
  calculateObjectHash,
};
