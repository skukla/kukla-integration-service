/**
 * Core HTTP module entry point
 * @module core/http
 */

const client = require('./client');
const responses = require('./responses');
const compression = require('./compression');

// Internal exports for core module
module.exports = {
    // Client utilities
    client,
    // Response handling
    response: responses,
    // Compression utilities
    compression
};

// Public API exports
module.exports.public = {
    ...client,
    ...responses,
    compression: compression.addCompression
}; 