/**
 * Scripts Core Utilities
 * Low-level pure functions and constants
 */

const basicFormatters = require('./basic-formatters');
const file = require('./file');
const format = require('./format');
const outputConstants = require('./output-constants');
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
  outputConstants,
  basicFormatters,
  sleep,
};
