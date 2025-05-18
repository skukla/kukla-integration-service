/**
 * Input validation utilities
 * @module utils/shared/validation/input
 */

/**
 * Checks for missing required parameters in the request
 * @param {Object} params - Request parameters
 * @param {string[]} [requiredParams=[]] - Required parameter paths
 * @param {string[]} [requiredHeaders=[]] - Required headers
 * @returns {string|null} Error message if validation fails, null otherwise
 */
function checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
    const missingParams = [];
    const missingHeaders = [];
    const headers = params.__ow_headers || {};

    // Check required parameters
    for (const param of requiredParams) {
        const value = param.split('.').reduce((obj, key) => obj && obj[key], params);
        if (value === undefined || value === '') {
            missingParams.push(param);
        }
    }

    // Check required headers
    for (const header of requiredHeaders) {
        if (!headers[header]) {
            missingHeaders.push(header);
        }
    }

    // Build error message if needed
    const errors = [];
    if (missingHeaders.length > 0) {
        errors.push(`missing header(s) '${missingHeaders.join(',')}'`);
    }
    if (missingParams.length > 0) {
        errors.push(`missing parameter(s) '${missingParams.join(',')}'`);
    }

    return errors.length > 0 ? errors.join(' and ') : null;
}

/**
 * Formats parameters for logging, hiding sensitive information
 * @param {Object} params - Parameters to format
 * @returns {string} Formatted parameters string
 */
function stringParameters(params) {
    const sanitized = { ...params };
    if (sanitized.__ow_headers?.authorization) {
        sanitized.__ow_headers = {
            ...sanitized.__ow_headers,
            authorization: '<hidden>'
        };
    }
    return JSON.stringify(sanitized);
}

module.exports = {
    checkMissingRequestInputs,
    stringParameters
}; 