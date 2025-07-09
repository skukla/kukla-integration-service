/**
 * Core Infrastructure Catalog
 * @module core
 *
 * This catalog exports all core infrastructure used across multiple domains:
 * - Action framework and initialization utilities
 * - HTTP client and response handling
 * - Tracing and performance monitoring
 * - Error handling and monitoring
 * - Environment detection and configuration
 * - URL building and routing
 * - Validation utilities (including product validation)
 * - Common utility functions
 * - CLI utilities
 *
 * Following functional composition principles - each function is pure
 * with clear input/output contracts.
 *
 * Core Infrastructure Domain - Migrated from shared utilities
 */

// Import all core infrastructure modules
const action = require('./action');
const cli = require('./cli');
const environment = require('./environment');
const errors = require('./errors');
const http = require('./http');
const monitoring = require('./monitoring');
const routing = require('./routing');
const tracing = require('./tracing');
const utils = require('./utils');
const validation = require('./validation');

module.exports = {
  // Action framework utilities
  initializeAction: action.initializeAction,
  wrapAction: action.wrapAction,
  createAction: action.createAction,
  executeStep: action.executeStep,
  // HTTP utilities
  request: http.client.request,
  buildHeaders: http.client.buildHeaders,
  createClient: http.client.createClient,
  extractActionParams: http.client.extractActionParams,
  success: http.response.success,
  error: http.response.error,
  compression: http.compression,
  // Tracing utilities
  createTraceContext: tracing.createTraceContext,
  traceStep: tracing.traceStep,
  incrementApiCalls: tracing.incrementApiCalls,
  getTracingConfig: tracing.getTracingConfig,
  // Monitoring utilities
  trackPerformance: monitoring.trackPerformance,
  trackError: monitoring.trackError,
  createMetrics: monitoring.createMetrics,
  formatMetrics: monitoring.formatMetrics,
  // Error handling utilities
  createError: utils.createError,
  // Environment utilities
  detectEnvironment: environment.detectEnvironment,
  isStaging: environment.isStaging,
  isProduction: environment.isProduction,
  getCurrentEnvironment: environment.getCurrentEnvironment,
  // URL and routing utilities
  buildRuntimeUrl: routing.buildRuntimeUrl,
  buildCommerceUrl: routing.buildCommerceUrl,
  buildActionUrl: routing.buildActionUrl,
  // Validation utilities
  checkMissingRequestInputs: validation.checkMissingRequestInputs,
  validateRequired: validation.validateRequired,
  validateString: validation.validateString,
  validateUrl: validation.validateUrl,
  checkMissingParams: validation.checkMissingParams,
  // Product validation utilities (extracted from products domain)
  getProductFields: validation.getProductFields,
  validateProduct: validation.validateProduct,
  getRequestedFields: validation.getRequestedFields,
  validateProductConfig: validation.validateProductConfig,
  // Common utilities
  formatStepMessage: utils.formatStepMessage,
  formatFileSize: utils.formatFileSize,
  formatDate: utils.formatDate,
  transformObject: utils.transformObject,
  sleep: utils.sleep,
  // CLI utilities
  parseArgs: cli.args.parseArgs,

  // Structured exports for organized access
  action: {
    initializeAction: action.initializeAction,
    wrapAction: action.wrapAction,
    createAction: action.createAction,
    executeStep: action.executeStep,
  },

  http: {
    request: http.client.request,
    buildHeaders: http.client.buildHeaders,
    createClient: http.client.createClient,
    extractActionParams: http.client.extractActionParams,
    responses: {
      success: http.response.success,
      error: http.response.error,
    },
    compression: http.compression,
  },

  tracing: {
    createTraceContext: tracing.createTraceContext,
    traceStep: tracing.traceStep,
    incrementApiCalls: tracing.incrementApiCalls,
    getTracingConfig: tracing.getTracingConfig,
  },

  monitoring: {
    trackPerformance: monitoring.trackPerformance,
    trackError: monitoring.trackError,
    createMetrics: monitoring.createMetrics,
    formatMetrics: monitoring.formatMetrics,
  },

  errors: {
    createError: utils.createError,
    // Add structured error types
    storage: errors.storage,
    http: errors.http,
  },

  environment: {
    detectEnvironment: environment.detectEnvironment,
    isStaging: environment.isStaging,
    isProduction: environment.isProduction,
    getCurrentEnvironment: environment.getCurrentEnvironment,
  },

  routing: {
    buildRuntimeUrl: routing.buildRuntimeUrl,
    buildCommerceUrl: routing.buildCommerceUrl,
    buildActionUrl: routing.buildActionUrl,
  },

  validation: {
    checkMissingRequestInputs: validation.checkMissingRequestInputs,
    validateRequired: validation.validateRequired,
    validateString: validation.validateString,
    validateUrl: validation.validateUrl,
    checkMissingParams: validation.checkMissingParams,
    getProductFields: validation.getProductFields,
    validateProduct: validation.validateProduct,
    getRequestedFields: validation.getRequestedFields,
    validateProductConfig: validation.validateProductConfig,
  },

  utils: {
    formatStepMessage: utils.formatStepMessage,
    formatFileSize: utils.formatFileSize,
    formatDate: utils.formatDate,
    transformObject: utils.transformObject,
    sleep: utils.sleep,
  },

  cli: {
    args: cli.args,
  },
};
