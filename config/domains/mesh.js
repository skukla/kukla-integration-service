/**
 * Mesh Domain Configuration
 * @module config/domains/mesh
 *
 * 🎯 Used by: API Mesh GraphQL endpoint integration
 * ⚙️ Key settings: Mesh endpoint, authentication, connection configuration
 *
 * 📋 Environment settings: Requires API_MESH_ENDPOINT and MESH_API_KEY from environment
 */

/**
 * Build mesh configuration
 * @param {Object} [params] - Action parameters for environment values
 * @param {Object} [mainConfig] - Shared main configuration (for future shared settings)
 * @returns {Object} Mesh configuration
 */
function buildMeshConfig(params = {}, mainConfig = {}) {
  // Note: mainConfig available for future shared settings
  // eslint-disable-next-line no-unused-vars
  mainConfig;

  // Get required values with clear descriptive fallbacks
  const endpoint =
    params.API_MESH_ENDPOINT || process.env.API_MESH_ENDPOINT || 'REQUIRED:API_MESH_ENDPOINT';
  const apiKey = params.MESH_API_KEY || process.env.MESH_API_KEY || 'REQUIRED:MESH_API_KEY';

  return {
    endpoint,
    apiKey,
  };
}

module.exports = {
  buildMeshConfig,
};
