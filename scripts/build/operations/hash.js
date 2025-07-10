/**
 * Hash Operations for Build Domain
 */

const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculate file hash using SHA-256
 * @param {string} filePath - Path to file
 * @returns {string} File hash
 */
function calculateFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate file hash: ${error.message}`);
  }
}

/**
 * Calculate object hash using SHA-256
 * @param {Object} obj - Object to hash
 * @returns {string} Object hash
 */
function calculateObjectHash(obj) {
  try {
    const jsonString = JSON.stringify(obj, null, 0);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate object hash: ${error.message}`);
  }
}

module.exports = {
  calculateFileHash,
  calculateObjectHash,
}; 
