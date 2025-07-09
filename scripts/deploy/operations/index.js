/**
 * Deploy Domain Operations
 * Business operations specific to deployment processes
 *
 * For shared operations like environment detection, spinner, and hash,
 * use scripts/core instead.
 */

// Currently no deploy-specific operations
// Use require('../core') for shared operations

const outputTemplates = require('./output-templates');

module.exports = {
  // No deploy-specific operations yet
  // All operations are available via core domain
  outputTemplates,
};
