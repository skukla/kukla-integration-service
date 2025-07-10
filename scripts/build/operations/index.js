/**
 * Build Domain Operations
 * Business operations specific to build processes
 * 
 * For shared operations like environment detection, spinner, and hash,
 * use scripts/core instead.
 * 
 * For formatting operations, use scripts/format instead.
 */

// Currently no build-specific operations
// Use require('../core') for shared operations
// Use require('../format') for formatting operations

const configGeneration = require('./config-generation');

module.exports = {
  // Configuration generation operations
  configGeneration,
}; 
