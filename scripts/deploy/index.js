/**
 * Deploy Domain
 * Orchestrates all deployment-related workflows
 */

const workflows = require('./workflows');

/**
 * Deploy domain catalog
 * Provides organized access to deployment functionality
 */
module.exports = {
  workflows,

  // Convenience methods for common operations
  app: workflows.appDeployment,
  mesh: workflows.meshDeployment,
};
