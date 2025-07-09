/**
 * Test Domain
 * Orchestrates all testing-related workflows
 */

const workflows = require('./workflows');

/**
 * Test domain catalog
 * Provides organized access to testing functionality
 */
module.exports = {
  workflows,

  // Main orchestration workflow (unified entry point)
  orchestrate: workflows.testOrchestration,

  // Convenience methods for common operations
  action: workflows.actionTesting,
  api: workflows.apiTesting,
  performance: workflows.performanceTesting,
};
