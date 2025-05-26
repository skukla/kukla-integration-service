/**
 * Core data handling module entry point
 * @module core/data
 */

const { checkMissingRequestInputs, validateInput } = require('./validation');
const { transformData, formatResponse } = require('./transformation');

module.exports = {
    // Validation utilities
    checkMissingRequestInputs,
    validateInput,
    
    // Transformation utilities
    transformData,
    formatResponse
}; 