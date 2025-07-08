/**
 * Core HTTP Client Operations
 * @module core/http/operations/client
 */

const fetch = require('node-fetch');

const { buildRequestOptions } = require('./request');
const { processResponseBody, createHttpError } = require('./response');

/**
 * Generic HTTP client for making requests
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options (method, headers, body, etc.)
 * @returns {Promise<Object>} The response data
 */
async function request(url, options = {}) {
  const requestOptions = buildRequestOptions(url, options);

  try {
    const response = await fetch(url, requestOptions);
    const body = await processResponseBody(response);

    if (!response.ok) {
      throw createHttpError(response, body);
    }

    return {
      statusCode: response.status,
      headers: response.headers,
      body,
    };
  } catch (error) {
    console.warn(`Request failed for ${url}:`, error.message);
    throw error;
  }
}

module.exports = {
  request,
};
