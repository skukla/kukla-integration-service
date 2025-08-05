/*
 * Adobe App Builder Standard Utilities
 */

/* This file exposes common utilities for App Builder actions following Adobe standards */

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters(params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {};
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' };
  }
  return JSON.stringify({ ...params, __ow_headers: headers });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys(obj, required) {
  return required.filter((r) => {
    const splits = r.split('.');
    const last = splits[splits.length - 1];
    const traverse = splits.slice(0, -1).reduce((tObj, split) => {
      tObj = tObj[split] || {};
      return tObj;
    }, obj);
    return traverse[last] === undefined || traverse[last] === ''; // missing default params are empty string
  });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null;

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map((h) => h.toLowerCase());
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders);
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`;
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams);
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and ';
    } else {
      errorMessage = '';
    }
    errorMessage += `missing parameter(s) '${missingParams}'`;
  }

  return errorMessage;
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken(params) {
  if (
    params.__ow_headers &&
    params.__ow_headers.authorization &&
    params.__ow_headers.authorization.startsWith('Bearer ')
  ) {
    return params.__ow_headers.authorization.substring('Bearer '.length);
  }
  return undefined;
}

/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse(statusCode, message, logger) {
  if (logger && typeof logger.error === 'function') {
    logger.error(`${statusCode}: ${message}`);
  }
  return {
    statusCode,
    body: {
      success: false,
      error: message,
    },
  };
}

/**
 * Returns a standard success response for Adobe App Builder actions
 * @param {Object} data - Response data object
 * @param {string} message - Success message
 * @param {Object} logger - Adobe logger instance
 * @returns {Object} Standard success response
 */
function successResponse(data, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(message);
  }
  return {
    statusCode: 200,
    body: {
      success: true,
      message,
      ...data,
    },
  };
}

/**
 * Generic Commerce API fetch with Adobe I/O Runtime error handling
 * @param {string} url - Request URL
 * @param {string} bearerToken - Authorization token
 * @param {string} method - HTTP method
 * @param {string} dataType - Data type for error messages
 * @returns {Promise<Array>} API response items
 */
async function fetchCommerceData(url, bearerToken, method = 'GET', dataType = 'data') {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`${dataType} fetch failed: ${response.status}`);
      return [];
    }

    const result = await response.json();
    return result.items || result || [];
  } catch (error) {
    console.warn(`${dataType} fetch error: ${error.message}`);
    return [];
  }
}

module.exports = {
  errorResponse,
  successResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  fetchCommerceData,
  formatFileSize,
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
