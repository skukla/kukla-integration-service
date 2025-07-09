/**
 * Mesh Domain Configuration
 * @module config/domains/mesh
 *
 * 🎯 Used by: API Mesh product export (consolidates 200+ calls to 1)
 * ⚙️ Key settings: GraphQL endpoints, pagination, batching optimization, caching
 */

/**
 * Build mesh configuration
 * @param {Object} params - Action parameters
 * @returns {Object} Mesh configuration
 */
function buildMeshConfig(params = {}) {
  // Get required values with clear descriptive fallbacks
  const endpoint =
    params.API_MESH_ENDPOINT || process.env.API_MESH_ENDPOINT || 'REQUIRED:API_MESH_ENDPOINT';
  const apiKey = params.MESH_API_KEY || process.env.MESH_API_KEY || 'REQUIRED:MESH_API_KEY';

  return {
    endpoint,
    apiKey,
    timeout: 30000,
    retries: 3,
    pagination: {
      defaultPageSize: 100,
      maxPages: 25,
    },
    batching: {
      categories: 20, // categories batch size
      inventory: 25, // inventory batch size
      requestDelay: 75, // delay between batches in ms
      maxConcurrent: 15, // max concurrent requests
    },
    caching: {
      categoryTtl: 300000, // 5 minutes in ms
      enableInMemoryCache: true,
    },
    performance: {
      bulkInventoryThreshold: 25, // SKUs per bulk request
      parallelProcessing: true, // enable parallel processing
      preAllocateArrays: true, // performance optimization
    },
  };
}

module.exports = {
  buildMeshConfig,
};
