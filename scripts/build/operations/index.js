/**
 * Build Domain Operations
 * Business operations specific to build processes
 * 
 * Following Strategic Duplication approach - domain-specific utilities
 * moved here for clarity and domain autonomy.
 */

const configGeneration = require('./config-generation');
const hash = require('./hash');
const string = require('./string');

module.exports = {
  // Configuration generation operations
  configGeneration,
  
  // Domain-specific utilities
  hash,
  string,
}; 
