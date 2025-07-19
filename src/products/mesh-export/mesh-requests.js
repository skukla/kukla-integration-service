/**
 * Mesh Export - API Mesh Requests Sub-module
 * All API Mesh request handling and retry utilities
 */

// Mesh Request Workflows

/**
 * Make mesh request with retry logic
 * @purpose Execute GraphQL request to API Mesh with retry on failure
 * @param {Object} requestConfig - Request configuration
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API Mesh response data
 * @throws {Error} When all retry attempts fail
 * @usedBy fetchEnrichedProductsFromMesh in mesh-export.js
 */
async function makeMeshRequestWithRetry(requestConfig, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: Execute mesh request
      const response = await executeMeshRequest(requestConfig);

      // Step 2: Validate response
      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response from API Mesh');
    } catch (error) {
      lastError = error;
      console.warn(`API Mesh request attempt ${attempt} failed:`, error.message);

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        await sleep(retryDelay * attempt); // Exponential backoff
      }
    }
  }

  throw new Error(`API Mesh request failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Fetch enriched products from API Mesh
 * @purpose Get complete product data including categories and inventory from API Mesh
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of enriched product objects
 * @throws {Error} When API Mesh request fails or returns invalid data
 * @usedBy exportMeshProducts in mesh-export.js
 */
async function fetchEnrichedProductsFromMesh(config, params, buildEnrichedProductsQuery) {
  try {
    // Step 1: Build GraphQL query
    const query = buildEnrichedProductsQuery(config);

    // Step 2: Prepare request configuration
    const requestConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.MESH_API_KEY || config.mesh.apiKey,
      },
      body: JSON.stringify({
        query: query,
      }),
    };

    // Step 3: Execute request with retry logic
    const meshResponse = await makeMeshRequestWithRetry({
      url: config.mesh.endpoint,
      ...requestConfig,
    });

    // Step 4: Extract and validate product data
    if (meshResponse.mesh_products_enriched && meshResponse.mesh_products_enriched.products) {
      return meshResponse.mesh_products_enriched.products;
    }

    throw new Error('No product data returned from API Mesh');
  } catch (error) {
    throw new Error(`Failed to fetch enriched products from mesh: ${error.message}`);
  }
}

// Mesh Request Utilities

/**
 * Execute mesh request
 * @purpose Make HTTP request to API Mesh endpoint
 * @param {Object} requestConfig - Request configuration
 * @returns {Promise<Object>} Response from API Mesh
 * @throws {Error} When request fails
 * @usedBy makeMeshRequestWithRetry
 */
async function executeMeshRequest(requestConfig) {
  const fetch = require('node-fetch');

  const response = await fetch(requestConfig.url, {
    method: requestConfig.method,
    headers: requestConfig.headers,
    body: requestConfig.body,
  });

  if (!response.ok) {
    throw new Error(`API Mesh request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

const { sleep } = require('../../shared/utils/async');

/**
 * Validate mesh response structure
 * @purpose Check if API Mesh response has expected structure
 * @param {Object} response - Response from API Mesh
 * @returns {boolean} True if response is valid
 * @usedBy Response validation in mesh requests
 */
function validateMeshResponse(response) {
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Check for GraphQL response structure
  if (response.data && typeof response.data === 'object') {
    return true;
  }

  // Check for direct data structure
  if (response.mesh_products_enriched) {
    return true;
  }

  return false;
}

/**
 * Extract error messages from mesh response
 * @purpose Get detailed error information from failed requests
 * @param {Object} response - Response from API Mesh
 * @returns {string} Error message or generic fallback
 * @usedBy Error handling in mesh requests
 */
function extractMeshErrorMessage(response) {
  if (response && response.errors && Array.isArray(response.errors)) {
    return response.errors.map((error) => error.message).join(', ');
  }

  if (response && response.error) {
    return response.error;
  }

  return 'Unknown API Mesh error';
}

module.exports = {
  // Workflows
  makeMeshRequestWithRetry,
  fetchEnrichedProductsFromMesh,

  // Utilities
  executeMeshRequest,
  sleep,
  validateMeshResponse,
  extractMeshErrorMessage,
};
