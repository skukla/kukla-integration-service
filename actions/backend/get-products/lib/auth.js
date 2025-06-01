/**
 * Authentication utilities for Adobe Commerce
 * @module lib/auth
 */
const { getAuthToken: getCommerceAuthToken } = require('../../../../src/commerce/api/integration');
const { createTraceContext, traceStep } = require('../../../../src/core/tracing');
/**
 * Gets an authentication token from Adobe Commerce
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken(params) {
  const trace = createTraceContext('auth', params);
  try {
    return await traceStep(trace, 'get-commerce-token', () => getCommerceAuthToken(params));
  } catch (error) {
    error.trace = trace;
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
module.exports = {
  getAuthToken,
};
