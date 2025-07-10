/**
 * Format Domain
 * Simple, focused formatting for script domains
 *
 * Exports only the functions actually used by scripts.
 * Internal DDD architecture maintained but hidden from public API.
 */

const facade = require('./facade');
const operations = require('./operations');
const utils = require('./utils');

// Simple, focused exports - only what's actually used
module.exports = {
  // Basic formatting (most commonly used)
  error: utils.error,
  warning: utils.warning,
  success: utils.success,

  // Section formatting
  sectionHeader: operations.sectionHeader,

  // Lifecycle shortcuts (from simplified facade)
  buildStart: facade.buildStart,
  buildDone: facade.buildDone,
  deployStart: facade.deployStart,
  deployDone: facade.deployDone,
  testStart: facade.testStart,
  testDone: facade.testDone,
};
