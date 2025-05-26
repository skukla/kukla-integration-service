/**
 * Core monitoring module entry point
 * @module core/monitoring
 */

const { createPerformanceMiddleware } = require('./performance');
const { createErrorResponse, processError } = require('./errors');

module.exports = {
    // Performance monitoring
    createPerformanceMiddleware,
    
    // Error handling
    createErrorResponse,
    processError
}; 