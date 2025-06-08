/**
 * Core module exports
 * Re-exports all core functionality for easy importing
 * @module core
 */

// URL management
export {
  getActionUrl,
  getDownloadUrl,
  getDeleteUrl,
  buildDownloadUrl,
  getConfig as getUrlConfig,
} from './url/index.js';

// Configuration management
export {
  loadConfig,
  getConfig,
  getRuntimeConfig,
  getPerformanceConfig,
  getEnvironment,
  isStaging,
  isProduction,
  getActions,
  getTimeout,
  getRuntimeUrl,
} from './config/index.js';

// Error handling
export { ErrorHandler, handleError, handleSpecificError, formatError } from './errors/index.js';
