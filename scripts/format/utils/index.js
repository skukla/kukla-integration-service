/**
 * Format Domain Utils
 * Low-level formatting utilities and constants
 * Shared infrastructure used across all script domains
 */

const basicFormatters = require('./basic-formatters');
const constants = require('./constants');
const templateFormatters = require('./template-formatters');

module.exports = {
  basicFormatters,
  constants,
  templateFormatters,

  // Direct exports for convenience
  ...constants,
  ...basicFormatters,
  ...templateFormatters,
};
