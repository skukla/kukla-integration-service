/**
 * Adobe Commerce integration module
 * @module commerce
 */

const api = require('./api');
const data = require('./data');
const transform = require('./transform');

module.exports = {
  // API client and endpoints
  api,

  // Data validation and handling
  data,

  // Data transformation utilities
  transform,
};
