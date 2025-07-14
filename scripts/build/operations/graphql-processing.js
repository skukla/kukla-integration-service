/**
 * GraphQL Processing Operations
 * Domain-specific operations for GraphQL schema processing
 */

const { print } = require('graphql');

const { processGraphQLSchemas } = require('../../../src/core/utils/operations/graphql');

/**
 * Convert GraphQL AST to string for Adobe API Mesh
 * @param {Object} additionalTypeDefs - GraphQL type definitions (AST or string)
 * @returns {string} GraphQL schema string
 */
function convertTypeDefsToString(additionalTypeDefs) {
  let sdlString;

  // Handle different input types
  if (typeof additionalTypeDefs === 'string') {
    sdlString = additionalTypeDefs;
  } else if (typeof additionalTypeDefs === 'object' && additionalTypeDefs.kind === 'Document') {
    // Use GraphQL print function to convert AST to string
    try {
      sdlString = print(additionalTypeDefs);
    } catch (error) {
      throw new Error(`Failed to convert GraphQL AST to string: ${error.message}`);
    }
  } else {
    throw new Error('Invalid GraphQL type definitions format');
  }

  // Use the processGraphQLSchemas function to remove conflicting schema declarations
  const mockMeshConfig = { additionalTypeDefs: sdlString };
  const processed = processGraphQLSchemas(mockMeshConfig);
  return processed.additionalTypeDefs;
}

module.exports = {
  convertTypeDefsToString,
}; 
