/**
 * API Test Cases
 * @module tests/api/test-cases
 */

const testCases = {
  'get-products': {
    // Basic functionality tests
    basic: [
      {
        name: 'Get all products with default fields',
        method: 'POST',
        fields: 'sku,name,price,qty,categories,images',
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.products && Array.isArray(response.products);
        },
      },
      {
        name: 'Get products with minimal fields',
        method: 'POST',
        fields: 'sku,name',
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.products && response.products.every((p) => p.sku && p.name);
        },
      },
    ],
    // Error handling tests
    errors: [
      {
        name: 'Invalid fields parameter',
        method: 'POST',
        fields: 'invalid,fields',
        expectedStatus: 400,
        validateResponse: (response) => {
          return response.error && response.error.includes('Invalid fields');
        },
      },
      {
        name: 'Missing required credentials',
        method: 'POST',
        fields: 'sku,name',
        headers: { 'x-remove-auth': 'true' },
        expectedStatus: 401,
        validateResponse: (response) => {
          return response.error && response.error.includes('Authentication required');
        },
      },
    ],
    // Edge cases
    edge: [
      {
        name: 'Request with all possible fields',
        method: 'POST',
        fields:
          'sku,name,price,qty,categories,images,url_key,type_id,attribute_set_id,created_at,updated_at,weight,visibility,tax_class_id,status',
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.products && response.products.length > 0;
        },
      },
      {
        name: 'Request with large page size',
        method: 'POST',
        fields: 'sku,name',
        params: { pageSize: 1000 },
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.products && response.products.length <= 1000;
        },
      },
    ],
  },
  'browse-files': {
    basic: [
      {
        name: 'List files in root directory',
        method: 'GET',
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.files && Array.isArray(response.files);
        },
      },
    ],
    errors: [
      {
        name: 'Invalid directory path',
        method: 'GET',
        params: { path: '../invalid' },
        expectedStatus: 400,
        validateResponse: (response) => {
          return response.error && response.error.includes('Invalid path');
        },
      },
    ],
    edge: [
      {
        name: 'List empty directory',
        method: 'GET',
        params: { path: 'empty' },
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.files && response.files.length === 0;
        },
      },
    ],
  },
  'download-file': {
    basic: [
      {
        name: 'Download existing file',
        method: 'GET',
        params: { filename: 'test.csv' },
        expectedStatus: 200,
        validateHeaders: (headers) => {
          return headers['content-type'] === 'application/octet-stream';
        },
      },
    ],
    errors: [
      {
        name: 'File not found',
        method: 'GET',
        params: { filename: 'nonexistent.csv' },
        expectedStatus: 404,
        validateResponse: (response) => {
          return response.error && response.error.includes('File not found');
        },
      },
    ],
  },
  'delete-file': {
    basic: [
      {
        name: 'Delete existing file',
        method: 'DELETE',
        params: { filename: 'test.csv' },
        expectedStatus: 200,
        validateResponse: (response) => {
          return response.success === true;
        },
      },
    ],
    errors: [
      {
        name: 'Delete non-existent file',
        method: 'DELETE',
        params: { filename: 'nonexistent.csv' },
        expectedStatus: 404,
        validateResponse: (response) => {
          return response.error && response.error.includes('File not found');
        },
      },
      {
        name: 'Delete file without permissions',
        method: 'DELETE',
        params: { filename: 'protected.csv' },
        expectedStatus: 403,
        validateResponse: (response) => {
          return response.error && response.error.includes('Permission denied');
        },
      },
    ],
  },
};

module.exports = testCases;
