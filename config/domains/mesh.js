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
  const meshEndpoint = params.API_MESH_ENDPOINT || process.env.API_MESH_ENDPOINT || null;
  const meshApiKey = params.MESH_API_KEY || process.env.MESH_API_KEY || null;

  return {
    endpoint: meshEndpoint,
    apiKey: meshApiKey,
    timeout: 30000,
    retries: 3,
    pagination: {
      defaultPageSize: 150,
      maxPages: 25,
      smallBatchSize: 100,
      largeBatchSize: 200,
      extraLargeBatchSize: 300,
    },
    batching: {
      categories: 20,
      inventory: 25,
      maxConcurrent: 15,
      requestDelay: 75,
    },
    caching: {
      categoryTtl: 300000, // 5 minutes (currently hardcoded in mesh resolvers)
      enableInMemoryCache: true,
    },
    performance: {
      bulkInventoryThreshold: 25, // Switch to bulk API when more than this many SKUs
      parallelProcessing: true,
      preAllocateArrays: true,
    },
  };
}

module.exports = {
  buildMeshConfig,
};
