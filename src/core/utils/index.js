/**
 * Core utilities catalog
 * @module core/utils
 *
 * Provides common utility functions organized by operational concern:
 * - Formatting: Message, file size, and date formatting
 * - Errors: Standardized error object creation
 * - Transformation: Object transformation utilities
 * - Async: Asynchronous operation utilities
 * - Template: Template substitution and processing utilities
 * - GraphQL: GraphQL schema processing and format conversion
 */

// Import operations modules
const async = require('./operations/async');
const errors = require('./operations/errors');
const formatting = require('./operations/formatting');
const graphql = require('./operations/graphql');
const template = require('./operations/template');
const transformation = require('./operations/transformation');

module.exports = {
  // Export individual functions for backward compatibility
  formatStepMessage: formatting.formatStepMessage,
  formatFileSize: formatting.formatFileSize,
  formatDate: formatting.formatDate,
  createError: errors.createError,
  transformObject: transformation.transformObject,
  sleep: async.sleep,

  // Template utilities
  applyGenericSubstitutions: template.applyGenericSubstitutions,
  validateTemplateSubstitution: template.validateTemplateSubstitution,

  // GraphQL utilities
  processGraphQLSchemas: graphql.processGraphQLSchemas,
  generateAdobeCliFormat: graphql.generateAdobeCliFormat,
  validateGraphQLSchema: graphql.validateGraphQLSchema,

  // Export organized by operation type
  formatting,
  errors,
  transformation,
  async,
  template,
  graphql,
};
