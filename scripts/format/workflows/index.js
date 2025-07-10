/**
 * Format Domain Workflows
 * High-level formatting workflows shared across all script domains
 */

const scriptLifecycle = require('./script-lifecycle');

module.exports = {
  scriptLifecycle,

  // Direct exports for convenience
  ...scriptLifecycle,
};
