/**
 * Testing Workflows Catalog
 * High-level business logic for testing operations
 */

const apiTesting = require('./api-testing');
const performanceTesting = require('./performance-testing');
const testOrchestration = require('./test-orchestration');

/**
 * Testing workflows catalog
 * Organizes all testing workflow functions
 */
module.exports = {
  apiTesting,
  performanceTesting,
  testOrchestration,
};
