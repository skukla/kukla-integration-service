/**
 * GraphQL operations for utilities
 * @module core/utils/operations/graphql
 *
 * Provides GraphQL schema processing, transformation, and format conversion utilities
 * for API Mesh integration and GraphQL schema compilation workflows.
 */

/**
 * Process GraphQL schemas from AST to SDL strings
 * @param {Object} meshConfig - Mesh configuration object with GraphQL schema definitions
 * @returns {Object} Processed configuration with GraphQL schemas converted to SDL strings
 *
 * @example
 * const meshConfig = {
 *   sources: [...],
 *   additionalTypeDefs: graphqlAST, // GraphQL AST object
 * };
 * const processed = processGraphQLSchemas(meshConfig);
 * // processed.additionalTypeDefs is now SDL string
 */
function processGraphQLSchemas(meshConfig) {
  const { print } = require('graphql');
  const processedConfig = { ...meshConfig };

  if (meshConfig.additionalTypeDefs) {
    let sdlString;

    if (typeof meshConfig.additionalTypeDefs === 'object') {
      // Convert GraphQL AST to SDL string using graphql print function
      sdlString = print(meshConfig.additionalTypeDefs);
    } else if (typeof meshConfig.additionalTypeDefs === 'string') {
      // Already a string, use as-is
      sdlString = meshConfig.additionalTypeDefs;
    } else {
      // Unknown type, return unchanged
      return processedConfig;
    }

    // Remove schema definition that conflicts with Adobe's OpenAPI Query type
    // Remove any occurrence of schema { query: Query } with flexible whitespace handling
    sdlString = sdlString.replace(/schema\s*\{\s*query:\s*Query\s*\}/gi, '');
    // Clean up any leftover empty lines or trailing whitespace
    sdlString = sdlString.replace(/\n\s*\n/g, '\n').trim();

    processedConfig.additionalTypeDefs = sdlString;
  }

  return processedConfig;
}

/**
 * Generate Adobe CLI-compatible format with meshConfig wrapper
 * @param {Object} meshConfig - Processed mesh configuration object
 * @returns {Object} Adobe CLI-compatible configuration with proper structure
 *
 * @example
 * const meshConfig = {
 *   sources: [...],
 *   additionalResolvers: [...],
 *   additionalTypeDefs: 'type Product { ... }',
 * };
 * const adobeFormat = generateAdobeCliFormat(meshConfig);
 * // Returns: { meshConfig: { sources: [...], ... } }
 */
function generateAdobeCliFormat(meshConfig) {
  return {
    meshConfig: {
      sources: meshConfig.sources,
      additionalResolvers: meshConfig.additionalResolvers,
      additionalTypeDefs: meshConfig.additionalTypeDefs,
    },
  };
}

/**
 * Convert SDL string to GraphQL AST object
 * @param {string} sdlString - Schema Definition Language string
 * @returns {Object} GraphQL AST object
 *
 * @example
 * const sdl = 'type Product { sku: String }';
 * const ast = convertSDLToAST(sdl);
 */
function convertSDLToAST(sdlString) {
  const { buildSchema } = require('graphql');
  return buildSchema(sdlString);
}

/**
 * Merge multiple GraphQL schema definitions into a single SDL string
 * @param {Array<string>} schemas - Array of SDL strings to merge
 * @returns {string} Merged SDL string
 *
 * @example
 * const schemas = ['type Product { sku: String }', 'type Category { id: Int }'];
 * const merged = mergeGraphQLSchemas(schemas);
 */
function mergeGraphQLSchemas(schemas) {
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return '';
  }

  // Simple concatenation with proper spacing
  return schemas
    .filter((schema) => schema && typeof schema === 'string')
    .join('\n\n')
    .trim();
}

/**
 * Validate GraphQL schema syntax
 * @param {string} sdlString - Schema Definition Language string to validate
 * @returns {Object} Validation result with success status and any errors
 */
function validateGraphQLSchema(sdlString) {
  try {
    const { buildSchema } = require('graphql');
    buildSchema(sdlString);
    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
    };
  }
}

module.exports = {
  processGraphQLSchemas,
  generateAdobeCliFormat,
  convertSDLToAST,
  mergeGraphQLSchemas,
  validateGraphQLSchema,
};
