/**
 * Build Domain
 * Orchestrates all build-related workflows
 */

const workflows = require('./workflows');

/**
 * Build domain catalog
 * Provides organized access to build functionality
 */
module.exports = {
  workflows,
  
  // Convenience methods for common operations
  app: workflows.appBuild,
  frontend: workflows.frontendGeneration,
  mesh: workflows.meshGeneration,
}; 
