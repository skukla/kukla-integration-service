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

// Load configuration with proper destructuring
const {
  app: APP_CONFIG,
  url: URL_CONFIG,
  commerce: COMMERCE_CONFIG,
  security: SECURITY_CONFIG,
  storage: STORAGE_CONFIG,
} = loadConfig();

// Export public APIs with configuration
module.exports = {
  http: http.public,
  data: data.public,
  storage: storage.public,
  monitoring: monitoring.public,
  config: {
    app: APP_CONFIG,
    url: URL_CONFIG,
    commerce: COMMERCE_CONFIG,
    security: SECURITY_CONFIG,
    storage: STORAGE_CONFIG,
  },
  routing,
};
