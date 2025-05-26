/**
 * Core storage module entry point
 * @module core/storage
 */

const cache = require('./cache');
const files = require('./files');

// Internal exports for core module
module.exports = {
    cache,
    files
};

// Public API exports
module.exports.public = {
    // Cache utilities
    ...cache,
    
    // File operations
    ...files
}; 