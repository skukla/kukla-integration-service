/**
 * Parameter validation operations
 * @module core/validation/operations/parameters
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
  requiredParams.forEach((param) => {
    const value = param.split('.').reduce((obj, key) => obj && obj[key], params);
    if (value === undefined || value === '') {
      missingParams.push(param);
    }
  });

  // Check for missing headers
  if (requiredHeaders.length > 0 && !params.__ow_headers) {
    missingHeaders.push(...requiredHeaders);
  } else {
    requiredHeaders.forEach((header) => {
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

/**
 * Check for missing required parameters (simplified version)
 * @param {Object} params - Parameters to check
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @throws {Error} If any required parameter is missing
 */
function checkMissingParams(params, requiredParams) {
  const missing = requiredParams.filter((param) => !params[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

module.exports = {
  checkMissingRequestInputs,
  checkMissingParams,
};
