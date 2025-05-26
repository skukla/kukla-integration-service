/**
 * Core storage module entry point
 * @module core/storage
 */

const { CacheConfig, MemoryCache, HttpCache } = require('./cache');
const files = require('./files');

module.exports = {
    // Cache utilities
    CacheConfig,
    MemoryCache,
    HttpCache,
    
    // File operations
    ...files
}; 