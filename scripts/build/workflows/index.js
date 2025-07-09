/**
 * Build Workflows
 * All build-related workflow orchestrations
 */

const appBuild = require('./app-build');
const frontendGeneration = require('./frontend-generation');
const meshGeneration = require('./mesh-generation');

/**
 * Build workflows catalog
 * Organizes all build workflow functions
 */
module.exports = {
  appBuild,
  frontendGeneration,
  meshGeneration,
}; 
