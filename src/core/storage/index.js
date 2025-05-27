/**
 * Core storage module entry point
 * @module core/storage
 */

const files = require('./files');
const cache = require('./cache');
const csv = require('./csv');

// Internal exports for core module
module.exports = {
    // File operations
    files,
    
    // Caching utilities
    cache,
    
    // CSV generation
    csv
};

// Public API exports
module.exports.public = {
    // Cache utilities
    ...cache,
    
    // File operations
    ...files,
    
    // CSV generation
    csv: {
        generateCsv: csv.generateCsv,
        createCsvStream: csv.createCsvStream,
        CSV_CONFIG: csv.CSV_CONFIG
    }
}; 