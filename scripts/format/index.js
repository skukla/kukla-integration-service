/**
 * Format Domain
 * Simple, consistent string-returning formatters
 *
 * SIMPLE RULE: All functions return formatted strings. Always use console.log() to print.
 *
 * Why this pattern:
 * - Zero cognitive load (same pattern everywhere)
 * - Pure functions (easy to test and compose)
 * - Industry standard (how most logging libraries work)
 * - Flexible (can redirect output, save to files, etc.)
 */

const facade = require('./facade');
const operations = require('./operations');
const utils = require('./utils');

// All functions return formatted strings - use console.log() to print
module.exports = {
  // Basic formatting - RETURNS STRINGS
  error: utils.error,
  warning: utils.warning,
  success: utils.success,
  info: utils.info,

  // Section formatting - RETURNS STRINGS
  section: operations.sectionHeader,
  header: operations.sectionHeader,

  // Lifecycle shortcuts - RETURNS STRINGS
  buildStart: facade.buildStart,
  buildDone: facade.buildDone,
  deployStart: facade.deployStart,
  deployDone: facade.deployDone,
  testStart: facade.testStart,
  testDone: facade.testDone,

  // Mesh shortcuts - RETURNS STRINGS
  meshStart: facade.meshStart,
  meshDone: facade.meshDone,
  meshUpdateStart: facade.meshUpdateStart,
  meshPollingStart: facade.meshPollingStart,

  // Common operations - RETURNS STRINGS
  verbose: (message) => utils.info(message),
  step: (message) => utils.success(`✔ ${message}`),
};
