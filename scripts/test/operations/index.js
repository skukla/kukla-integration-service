/**
 * Test Domain Operations
 * Business operations specific to testing processes
 *
 * For shared operations like environment detection, spinner, and hash,
 * use scripts/core instead.
 *
 * For display formatting, use scripts/format/display instead.
 */

const testExecution = require('./test-execution');

module.exports = {
  testExecution,
  // Display formatting moved to scripts/format/display
  // All shared operations available via core domain
};
