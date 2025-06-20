/**
 * Core module entry point
 * @module core
 *
 * This module provides centralized access to all core functionality:
 * - HTTP client and response handling
 * - Data validation and transformation
 * - Storage and caching operations
 * - Error monitoring and performance tracking
 * - Configuration management
 * - URL management and routing
 *
 * @example
 * // Import specific modules
 * const { http, storage } = require('./core');
 *
 * // Make HTTP request with caching
 * const response = await http.request(url, {
 *   cache: storage.HttpCache
 * });
 *
 * @example
 * // Use monitoring with storage
 * const { monitoring, storage } = require('./core');
 * try {
 *   await storage.files.writeFile(path, content);
 * } catch (error) {
 *   monitoring.errors.createErrorResponse('STORAGE', error.message);
 * }
 *
 * @example
 * // Access configuration and build URLs
 * const { config, routing } = require('./core');
 * const { commerce } = config;
 * const productUrl = routing.buildCommerceUrl('products', { id: '123' });
 */

const data = require('./data');
const http = require('./http');
const monitoring = require('./monitoring');
const routing = require('./routing');
const storage = require('./storage');
const { loadConfig } = require('../../config');

// Export public APIs with clean configuration loading
module.exports = {
  http: http.public,
  data,
  storage: storage.public,
  monitoring: monitoring.public,
  routing,

  /**
   * Loads configuration using the new organized system
   * @param {Object} [params] - Action parameters for Adobe I/O Runtime
   * @returns {Object} Complete configuration object
   */
  getConfig(params = {}) {
    return loadConfig(params);
  },

  // Backward compatibility - config getter
  get config() {
    return this.getConfig();
  },
};
