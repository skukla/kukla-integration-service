const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const { client: http } = require('../http');
const { buildHeaders } = require('../http/client');
const { buildRuntimeUrl } = require('../routing');
const { getConfig } = require('./config');
const { createTraceContext, traceStep, formatTrace } = require('../tracing');

const { request } = http;
// Get default configuration
const config = getConfig();
// Default base URL for local development
const DEFAULT_BASE_URL = 'https://285361-188maroonwallaby-stage.adobeio-static.net';
// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
/**
 * Test a single API endpoint
 * @param {string} endpoint - The endpoint to test
 * @param {Object} params - Request parameters
 * @param {string} method - HTTP method
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {Function} validate - Optional validation function
 * @param {Object} schema - Optional request/response schemas
 */
async function testEndpoint(
  endpoint,
  params = {},
  method = 'POST',
  expectedStatus = 200,
  validate,
  schema = {}
) {
  // Create a copy of params and remove schema
  const requestParams = { ...params };
  delete requestParams.schema;
  const trace = createTraceContext(`test-${endpoint}`, { endpoint, method, requestParams });
  try {
    // Get the endpoint URL
    const url = await traceStep(trace, 'build-url', () =>
      buildRuntimeUrl(endpoint, DEFAULT_BASE_URL)
    );
    // Validate request parameters against schema if provided
    if (schema.request) {
      await traceStep(trace, 'validate-request', () => {
        const validateRequest = ajv.compile(schema.request);
        const valid = validateRequest(requestParams);
        if (!valid) {
          throw new Error(`Request validation failed: ${ajv.errorsText(validateRequest.errors)}`);
        }
        return true;
      });
    }
    // Debug log the request
    console.log('\n📤 Request:', {
      url,
      method,
      headers: buildHeaders(null, {
        'Content-Type': 'application/json',
      }),
      body: requestParams,
    });
    // Make the request with configured timeout and retries
    const response = await traceStep(trace, 'make-request', () =>
      request(url, {
        method,
        headers: buildHeaders(null, {
          'Content-Type': 'application/json',
        }),
        body: requestParams,
        timeout: config.request.timeout,
        retries: config.request.retries,
        retryDelay: config.request.retryDelay,
        rejectUnauthorized: false, // Allow self-signed certificates for local testing
      })
    );
    // Debug log the response
    console.log('\n📥 Response:', {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
    });
    // Process and validate the response
    await traceStep(trace, 'process-response', async () => {
      // Extract and normalize response parameters
      const responseParams = response.body;
      // Validate response against schema if provided
      if (schema.response) {
        const validateResponse = ajv.compile(schema.response);
        const valid = validateResponse(responseParams);
        if (!valid) {
          throw new Error(`Response validation failed: ${ajv.errorsText(validateResponse.errors)}`);
        }
      }
      // Validate status code
      if (response.statusCode !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.statusCode}`);
      }
      // Validate success field if configured
      if (config.validation.requireSuccessField && response.body.success === false) {
        throw new Error('Response indicates failure');
      }
      // Run custom validation if provided
      if (validate) {
        await validate(responseParams);
      }
      return responseParams;
    });
    // Return both the response and trace data
    return {
      response,
      trace: formatTrace(trace),
    };
  } catch (error) {
    // Attach trace data to error
    error.trace = formatTrace(trace);
    if (error.response) {
      error.responseBody = error.response.body;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Test API request failed:', error.message);
    }
    throw error;
  }
}
// Common validation functions
const validations = {
  validateArray: (fieldName) => async (response) => {
    const array = response.body[fieldName];
    if (!Array.isArray(array)) {
      throw new Error(`Expected ${fieldName} to be an array`);
    }
    if (array.length === 0 && config.validation.warnOnEmptyArrays) {
      console.warn(`⚠️ Warning: No ${fieldName} returned`);
    }
    return true;
  },
  validateFields: (requiredFields) => async (response) => {
    for (const field of requiredFields) {
      if (!response.body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  },
};
// Pre-configured test functions for common endpoints
const tests = {
  async products(options = {}) {
    const { schema, ...params } = options;
    return testEndpoint(
      'get-products',
      params,
      'POST',
      200,
      validations.validateArray('products'),
      schema
    );
  },
  async browseFiles(options = {}) {
    const { schema, ...params } = options;
    return testEndpoint(
      'browse-files',
      params,
      'GET',
      200,
      validations.validateArray('files'),
      schema
    );
  },
  async downloadFile(filename, options = {}) {
    const { schema, ...params } = options;
    return testEndpoint(
      'download-file',
      { filename, ...params },
      'GET',
      200,
      (response) => {
        if (!response.body) {
          throw new Error('No file content received');
        }
        return true;
      },
      schema
    );
  },
};
module.exports = {
  testEndpoint,
  validations,
  tests,
  getConfig,
};
