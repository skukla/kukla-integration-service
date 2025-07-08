/**
 * Core utilities catalog
 * @module core/utils
 *
 * Provides common utility functions organized by operational concern:
 * - Formatting: Message, file size, and date formatting
 * - Errors: Standardized error object creation
 * - Transformation: Object transformation utilities
 * - Async: Asynchronous operation utilities
 */

// Import operations modules
const async = require('./operations/async');
const errors = require('./operations/errors');
const formatting = require('./operations/formatting');
const transformation = require('./operations/transformation');

module.exports = {
  // Export individual functions for backward compatibility
  formatStepMessage: formatting.formatStepMessage,
  formatFileSize: formatting.formatFileSize,
  formatDate: formatting.formatDate,
  createError: errors.createError,
  transformObject: transformation.transformObject,
  sleep: async.sleep,

  // Export organized by operation type
  formatting,
  errors,
  transformation,
  async,
};
