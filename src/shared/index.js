/**
 * Shared Utilities Catalog
 * @module shared
 *
 * This catalog exports all truly shared utilities used across multiple domains:
 * - HTTP client and response handling
 * - Tracing and performance monitoring
 * - Error handling and monitoring
 * - Environment detection and configuration
 * - URL building and routing
 * - Validation utilities
 * - Common utility functions
 *
 * Following functional composition principles - each function is pure
 * with clear input/output contracts.
 *
 * Phase 5: Shared Utilities consolidation
 */

// Import all shared modules
const environment = require('./environment');
const errors = require('./errors');
const http = require('./http');
const monitoring = require('./monitoring');
const routing = require('./routing');
const tracing = require('./tracing');
const utils = require('./utils');
const validation = require('./validation');

module.exports = {
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
  createError: errors.createError,
  createErrorResponse: errors.createErrorResponse,
  handleError: errors.handleError,
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
  // Common utilities
  formatStepMessage: utils.formatStepMessage,
  formatFileSize: utils.formatFileSize,
  formatDate: utils.formatDate,
  transformObject: utils.transformObject,
  sleep: utils.sleep,
  // Structured exports for organized access
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
    createError: errors.createError,
    createErrorResponse: errors.createErrorResponse,
    handleError: errors.handleError,
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
  },

  utils: {
    formatStepMessage: utils.formatStepMessage,
    formatFileSize: utils.formatFileSize,
    formatDate: utils.formatDate,
    transformObject: utils.transformObject,
    sleep: utils.sleep,
  },
};
