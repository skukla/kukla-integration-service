/**
 * Testing Domain Catalog
 * Following Domain-Driven Design (DDD) principles
 *
 * Domain: Testing
 * Purpose: API testing, performance testing, and test orchestration
 * Scope: All testing-related functionality
 */

const operations = require('./operations');
const utils = require('./utils');
const workflows = require('./workflows');

/**
 * Testing domain catalog
 * Provides organized access to all testing functionality
 */
module.exports = {
  // Main workflows (high-level business logic)
  workflows,

  // Core operations (mid-level functionality)
  operations,

  // Utilities (low-level helpers)
  utils,

  // Convenience methods for common operations
  apiTest: workflows.apiTesting,
  performanceTest: workflows.performanceTesting,
  orchestrateTest: workflows.testOrchestration,
};
