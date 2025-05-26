/**
 * Core HTTP module entry point
 * @module core/http
 */

const { buildHeaders, getBearerToken, request, extractActionParams, checkMissingParams } = require('./client');
const { response, createResponseHandlerState, addStep, createSuccessResponse, createErrorResponse } = require('./responses');
const { addCompression } = require('./compression');

module.exports = {
    // Client utilities
    buildHeaders,
    getBearerToken,
    request,
    extractActionParams,
    checkMissingParams,
    
    // Response utilities
    response,
    createResponseHandlerState,
    addStep,
    createSuccessResponse,
    createErrorResponse,
    
    // Compression utilities
    addCompression
}; 