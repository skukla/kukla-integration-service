/**
 * GraphQL Processing Operations
 * Domain-specific operations for GraphQL schema processing
 */

const { print } = require('graphql');

/**
 * Convert GraphQL AST to string for Adobe API Mesh
 * @param {Object} additionalTypeDefs - GraphQL type definitions (AST or string)
 * @returns {string} GraphQL schema string
 */
function convertTypeDefsToString(additionalTypeDefs) {
  // Handle different input types
  if (typeof additionalTypeDefs === 'string') {
    return additionalTypeDefs;
  }

  if (typeof additionalTypeDefs === 'object' && additionalTypeDefs.kind === 'Document') {
    // Use GraphQL print function to convert AST to string
    try {
      return print(additionalTypeDefs);
    } catch (error) {
      throw new Error(`Failed to convert GraphQL AST to string: ${error.message}`);
    }
  }

  throw new Error('Invalid GraphQL type definitions format');
}

module.exports = {
  convertTypeDefsToString,
}; 
