/**
 * Build Domain Operations
 * Business operations specific to build processes
 * 
 * For shared operations like environment detection, spinner, and hash,
 * use scripts/core instead.
 */

// Currently no build-specific operations
// Use require('../core') for shared operations

const configGeneration = require('./config-generation');
const outputTemplates = require('./output-templates');

module.exports = {
  configGeneration,
  outputTemplates,
  // No build-specific operations yet
  // All operations are available via core domain
}; 
