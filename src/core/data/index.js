/**
 * Core data handling module entry point
 * @module core/data
 */

const { transformData, formatResponse } = require('./transformation');
const { checkMissingRequestInputs, validateInput } = require('./validation');

// Internal utilities
const internal = {
  checkMissingRequestInputs,
  validateInput,
  transformData,
  formatResponse,
};

// Public API
const publicApi = {
  validateInput,
  transformData,
  formatResponse,
};

module.exports = {
  ...internal,
  public: publicApi,
};
