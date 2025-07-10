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
 *
 * CONSOLIDATED: Unified access to all formatting functionality
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
  progress: utils.progress, // Enhanced with current/total support
  step: utils.step,
  text: utils.text,
  muted: utils.muted,
  bold: utils.bold,
  highlight: utils.highlight,
  url: utils.url, // Enhanced with label support

  // Section formatting - RETURNS STRINGS
  section: operations.sectionHeader,
  header: operations.sectionHeader,
  subsection: operations.subsectionHeader,
  completion: operations.completion,
  finalSuccess: operations.finalSuccess,

  // Script lifecycle - RETURNS STRINGS
  scriptStart: operations.scriptStart,
  scriptEnd: operations.scriptEnd,

  // Mesh operations - RETURNS STRINGS
  meshUpdateStart: operations.meshUpdateStart,
  meshPollingStart: operations.meshPollingStart,
  meshStartEmphasis: operations.meshStartEmphasis,
  meshCompleteEmphasis: operations.meshCompleteEmphasis,

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

  // Legacy aliases for backward compatibility (will be removed in cleanup phase)
  verbose: (message) => utils.info(message),
};
