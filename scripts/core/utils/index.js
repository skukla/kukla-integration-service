/**
 * Scripts Core Utils
 * Pure utility functions shared across all script domains
 */

const file = require('./file');
const format = require('./format');
const string = require('./string');

module.exports = {
  format,
  string,
  file,
};
