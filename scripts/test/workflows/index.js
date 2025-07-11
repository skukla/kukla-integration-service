/**
 * Test Workflows
 * All testing-related workflow orchestrations
 */

const actionTesting = require('./action-testing');
const apiTesting = require('./api-testing');
const performanceTesting = require('./performance-testing');
const testOrchestration = require('./test-orchestration');

/**
 * Test workflows catalog
 * Organizes all testing workflow functions
 */
module.exports = {
  actionTesting,
  apiTesting,
  performanceTesting,
  testOrchestration,
};
