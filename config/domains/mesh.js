/**
 * Mesh Domain Configuration
 * @module config/domains/mesh
 *
 * 🎯 Used by: API Mesh GraphQL endpoint integration
 * ⚙️ Key settings: Mesh endpoint, authentication, connection configuration
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
    timeout: 30000, // Mesh GraphQL request timeout
    retries: 3, // Mesh connection retries
  };
}

module.exports = {
  buildMeshConfig,
};
