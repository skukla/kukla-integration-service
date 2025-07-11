/**
 * Build Domain Operations
 * Business operations specific to build processes
 * 
 * Following Strategic Duplication approach - domain-specific utilities
 * moved here for clarity and domain autonomy.
 */

const configGeneration = require('./config-generation');

module.exports = {
  // Configuration generation operations
  configGeneration,
}; 
