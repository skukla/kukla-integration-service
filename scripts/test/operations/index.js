/**
 * Test Domain Operations
 * Business operations specific to testing processes
 *
 * For shared operations like environment detection, spinner, and hash,
 * use scripts/core instead.
 */

// Currently no test-specific operations
// Use require('../core') for shared operations

const displayFormatting = require('./display-formatting');
const testExecution = require('./test-execution');

module.exports = {
  displayFormatting,
  testExecution,
  // No test-specific operations yet
  // All operations are available via core domain
};
