/**
 * Shared input validation utilities for actions
 * @module actions/shared/validation/input
 */

/**
 * Checks for missing required parameters in the request
 * @param {Object} params - Request parameters
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @param {Array<string>} [requiredHeaders] - Array of required header names
 * @returns {string|null} Error message if validation fails, null if successful
 */
function checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
    const missingParams = [];
    const missingHeaders = [];

    // Check for missing parameters
    requiredParams.forEach(param => {
        const value = param.split('.').reduce((obj, key) => obj && obj[key], params);
        if (value === undefined || value === '') {
            missingParams.push(param);
        }
    });

    // Check for missing headers
    if (requiredHeaders.length > 0 && !params.__ow_headers) {
        missingHeaders.push(...requiredHeaders);
    } else {
        requiredHeaders.forEach(header => {
            if (!params.__ow_headers[header]) {
                missingHeaders.push(header);
            }
        });
    }

    if (missingParams.length > 0 && missingHeaders.length > 0) {
        return `missing header(s) '${missingHeaders.join(',')}' and missing parameter(s) '${missingParams.join(',')}'`;
    }
    if (missingParams.length > 0) {
        return `missing parameter(s) '${missingParams.join(',')}'`;
    }
    if (missingHeaders.length > 0) {
        return `missing header(s) '${missingHeaders.join(',')}'`;
    }
    return null;
}

module.exports = {
    checkMissingRequestInputs
}; 