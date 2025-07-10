/**
 * Build Workflows
 * All build-related workflow orchestrations
 */

const { appBuildWorkflow } = require('./app-build');
const { generateFrontendConfig } = require('./frontend-generation');
const { generateMeshResolver } = require('./mesh-generation');

/**
 * Build workflows catalog
 * Organizes all build workflow functions
 */
module.exports = {
  appBuildWorkflow,
  frontendGenerationWorkflow: generateFrontendConfig,
  meshGenerationWorkflow: generateMeshResolver,
}; 
