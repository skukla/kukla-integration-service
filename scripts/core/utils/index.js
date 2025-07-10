/**
 * Scripts Core Utilities
 * Low-level pure functions and constants
 *
 */

const file = require('./file');
const format = require('../formatting');
const string = require('./string');

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  file,
  format,
  string,
  sleep,
};
