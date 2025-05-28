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
 * const { config, url } = require('./core');
 * const { commerce } = config.loadConfig();
 * const productUrl = url.buildCommerceUrl('products', { id: '123' });
 */

const http = require('./http');
const data = require('./data');
const storage = require('./storage');
const monitoring = require('./monitoring');
const config = require('../../config');
const routing = require('./routing');

// Export public APIs only
module.exports = {
    http: http.public,
    data: data.public,
    storage: storage.public,
    monitoring: monitoring.public,
    config,
    routing
}; 