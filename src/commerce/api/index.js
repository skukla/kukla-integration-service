/**
 * Commerce API module entry point
 * @module commerce/api
 */

const client = require('./client');
const endpoints = require('./endpoints');

module.exports = {
    // Client utilities
    ...client,
    
    // Endpoint definitions
    endpoints
}; 