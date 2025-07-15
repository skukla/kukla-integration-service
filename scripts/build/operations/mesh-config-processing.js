/**
 * Build Domain - Mesh Configuration Processing Operations
 * Domain-specific operations for mesh configuration processing
 */

const graphqlProcessing = require('./graphql-processing');
const { loadModule } = require('../../core/operations/module-loading');
const { replaceDomain } = require('../../core/utils/url');

/**
 * Load mesh configuration from mesh.config.js
 * @param {string} [configPath] - Path to mesh configuration file
 * @returns {Object} Loaded mesh configuration
 */
function loadMeshConfig(configPath = 'mesh.config.js') {
  const errorMessage = `Mesh configuration source not found: ${configPath}`;
  return loadModule(configPath, errorMessage);
}

/**
 * Process mesh configuration sources with URL substitution
 * @param {Array} sources - Mesh configuration sources
 * @param {Object} config - Application configuration
 * @returns {Array} Processed sources with updated URLs
 */
function processMeshSources(sources, config) {
  return sources.map(source => {
    if (source.handler?.openapi?.source) {
      // Replace with Commerce URL from configuration
      source.handler.openapi.source = replaceDomain(
        source.handler.openapi.source,
        config.commerce.baseUrl
      );
    }
    return source;
  });
}

/**
 * Build complete mesh configuration for Adobe API Mesh
 * @param {Object} meshConfig - Source mesh configuration
 * @param {Object} config - Application configuration
 * @returns {Object} Processed mesh configuration
 */
function buildMeshConfig(meshConfig, config) {
  // Process GraphQL type definitions
  const additionalTypeDefs = graphqlProcessing.convertTypeDefsToString(meshConfig.additionalTypeDefs);
  
  // Process sources with URL substitution
  const processedSources = processMeshSources(meshConfig.sources, config);
  
  // Build mesh configuration object
  const meshConfigObject = {
    sources: processedSources,
    additionalResolvers: meshConfig.additionalResolvers,
    additionalTypeDefs: additionalTypeDefs,
  };

  // Include responseConfig if present (for native caching)
  if (meshConfig.responseConfig) {
    meshConfigObject.responseConfig = meshConfig.responseConfig;
  }
  
  // Return Adobe API Mesh format
  return {
    meshConfig: meshConfigObject,
  };
}

module.exports = {
  loadMeshConfig,
  processMeshSources,
  buildMeshConfig,
}; 
