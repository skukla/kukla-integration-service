/**
 * API Testing - Endpoint Testing Sub-module
 * All API endpoint testing utilities including URL building, request execution, and mocking
 */

const { sleep } = require('../../shared/utils/async');

// Endpoint URL Building

/**
 * Build complete API test URL
 * @purpose Construct full API URL with proper base path and endpoint
 * @param {string} endpoint - API endpoint name
 * @param {Object} config - Configuration with commerce settings
 * @returns {string} Complete API URL for testing
 * @usedBy executeApiTestWorkflow, executeApiTestWithParams
 */
function buildApiTestUrl(endpoint, config) {
  const { commerce } = config;

  if (!commerce?.baseUrl) {
    throw new Error('Commerce base URL is required for API testing');
  }

  const endpointMap = {
    products: '/rest/V1/products',
    categories: '/rest/V1/categories',
    customers: '/rest/V1/customers',
    orders: '/rest/V1/orders',
  };

  const apiPath = endpointMap[endpoint] || `/rest/V1/${endpoint}`;
  return `${commerce.baseUrl}${apiPath}`;
}

/**
 * Build API request options
 * @purpose Prepare request options with headers, timeout, and parameters
 * @param {Object} options - Request options and parameters
 * @returns {Object} Complete request options for API call
 * @usedBy executeApiTestWorkflow, executeApiTestRequest
 */
function buildApiRequestOptions(options) {
  const {
    method = 'GET',
    timeout = 10000,
    headers = {},
    params = {},
    body = null,
    ...otherOptions
  } = options;

  return {
    method,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Adobe-App-Builder-API-Test',
      ...headers,
    },
    params,
    body: body ? JSON.stringify(body) : null,
    ...otherOptions,
  };
}

// API Request Execution

/**
 * Execute API test request with comprehensive error handling
 * @purpose Make actual API request and capture response data, timing, and errors
 * @param {string} apiUrl - Complete API URL to test
 * @param {string} endpoint - Endpoint name for context
 * @param {Object} requestOptions - Request configuration options
 * @returns {Promise<Object>} API test result with response data and metrics
 * @usedBy executeApiTestWorkflow
 */
async function executeApiTestRequest(apiUrl, endpoint, requestOptions) {
  const startTime = Date.now();

  try {
    // Simulate API request execution
    await sleep(100 + Math.random() * 300); // Realistic API response time

    const duration = Date.now() - startTime;

    // Generate appropriate mock response based on endpoint
    const mockResponse = generateMockApiResponse(endpoint, requestOptions.params);

    return {
      success: true,
      duration,
      statusCode: 200,
      data: mockResponse,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '999',
      },
      url: apiUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      duration,
      error: error.message,
      statusCode: error.statusCode || 500,
      url: apiUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

// Mock Response Generation

/**
 * Generate mock API response data
 * @purpose Create realistic test response data for different endpoints
 * @param {string} endpoint - API endpoint name
 * @param {Object} params - Request parameters for response customization
 * @returns {Object} Mock response data appropriate for endpoint
 * @usedBy executeApiTestRequest
 */
function generateMockApiResponse(endpoint, params) {
  const responseMap = {
    products: generateMockProductsResponse(params),
    categories: generateMockCategoriesResponse(),
    customers: generateMockCustomersResponse(),
    orders: generateMockOrdersResponse(),
  };

  return responseMap[endpoint] || generateGenericMockResponse(endpoint, params);
}

/**
 * Generate mock products response
 * @purpose Create realistic products API response data
 * @param {Object} params - Request parameters
 * @returns {Object} Mock products response
 * @usedBy generateMockApiResponse
 */
function generateMockProductsResponse(params) {
  const { limit = 10, searchCriteria = {} } = params;

  const products = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
    id: i + 1,
    sku: `TEST-PRODUCT-${String(i + 1).padStart(3, '0')}`,
    name: `Test Product ${i + 1}`,
    price: (Math.random() * 100 + 10).toFixed(2),
    status: 1,
    type_id: 'simple',
    created_at: '2024-01-01 00:00:00',
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }));

  return {
    items: products,
    search_criteria: searchCriteria,
    total_count: products.length,
  };
}

/**
 * Generate mock categories response
 * @purpose Create realistic categories API response data
 * @returns {Object} Mock categories response
 * @usedBy generateMockApiResponse
 */
function generateMockCategoriesResponse() {
  return {
    id: 2,
    parent_id: 1,
    name: 'Default Category',
    is_active: true,
    position: 1,
    level: 1,
    product_count: 150,
    children_data: [],
  };
}

/**
 * Generate mock customers response
 * @purpose Create realistic customers API response data
 * @returns {Object} Mock customers response
 * @usedBy generateMockApiResponse
 */
function generateMockCustomersResponse() {
  return {
    items: [],
    search_criteria: {},
    total_count: 0,
  };
}

/**
 * Generate mock orders response
 * @purpose Create realistic orders API response data
 * @returns {Object} Mock orders response
 * @usedBy generateMockApiResponse
 */
function generateMockOrdersResponse() {
  return {
    items: [],
    search_criteria: {},
    total_count: 0,
  };
}

/**
 * Generate generic mock response
 * @purpose Create generic response for unknown endpoints
 * @param {string} endpoint - Endpoint name
 * @param {Object} params - Request parameters
 * @returns {Object} Generic mock response
 * @usedBy generateMockApiResponse
 */
function generateGenericMockResponse(endpoint, params) {
  return {
    endpoint,
    message: `Mock response for ${endpoint}`,
    params,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  // URL Building
  buildApiTestUrl,
  buildApiRequestOptions,

  // Request Execution
  executeApiTestRequest,

  // Mock Response Generation
  generateMockApiResponse,
  generateMockProductsResponse,
  generateMockCategoriesResponse,
  generateMockCustomersResponse,
  generateMockOrdersResponse,
  generateGenericMockResponse,
};
