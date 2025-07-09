/**
 * Scripts Core Utils
 * Pure utility functions shared across all script domains
 */

const file = require('./file');
const format = require('./format');
const string = require('./string');

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  format,
  string,
  file,
  sleep,
};
