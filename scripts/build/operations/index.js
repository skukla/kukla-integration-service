/**
 * Build Domain Operations
 * Business operations specific to build processes
 * 
 * Following Strategic Duplication approach - domain-specific utilities
 * moved here for clarity and domain autonomy.
 */

const configGeneration = require('./config-generation');
const graphqlProcessing = require('./graphql-processing');
const meshConfigProcessing = require('./mesh-config-processing');
const meshCoreOperations = require('./mesh-core-operations');
const meshGenerationOutput = require('./mesh-generation-output');

module.exports = {
  configGeneration,
  graphqlProcessing,
  meshConfigProcessing,
  meshCoreOperations,
  meshGenerationOutput,
}; 
