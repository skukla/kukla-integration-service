/**
 * Core data handling module entry point
 * @module core/data
 */

const { transformObject, formatResponse } = require('./transformation');
const { checkMissingRequestInputs, validateInput } = require('./validation');

// Internal utilities
const internal = {
  checkMissingRequestInputs,
  validateInput,
  transformObject,
  formatResponse,
};

// Public API
const publicApi = {
  validateInput,
  transformObject,
  formatResponse,
};

module.exports = {
  ...internal,
  public: publicApi,
};
