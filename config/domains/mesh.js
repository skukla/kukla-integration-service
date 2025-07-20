/**
 * Mesh Domain Configuration
 * @module config/domains/mesh
 *
 * Used by: API Mesh GraphQL endpoint integration
 * ⚙️ Key settings: Mesh endpoint, authentication, connection configuration
 *
 * 📋 Environment settings: Requires API_MESH_ENDPOINT and MESH_API_KEY from environment
 */

const { getMeshParameters } = require('../../src/shared/utils/parameters');

/**
 * Build mesh configuration
 * @param {Object} [params] - Action parameters for environment values
 * @returns {Object} Mesh configuration
 */
function buildMeshConfig(params = {}) {
  // Use our convenience function - much simpler!
  const { endpoint, apiKey } = getMeshParameters(params);

  return {
    endpoint,
    apiKey,
    batching: {
      // Display limits for category queries
      categoryDisplayLimit: 10,
      // Batch thresholds (when to use batch vs individual calls)
      thresholds: {
        categories: 1, // Use batch for 1 or more categories
        inventory: 1, // Use batch for 1 or more SKUs
      },
    },
  };
}

module.exports = {
  buildMeshConfig,
};
