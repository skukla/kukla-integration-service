/**
 * Mesh Domain Workflows
 * High-level orchestration workflows for mesh processes
 *
 * Organized by workflow type:
 * - Compile: Mesh compilation and generation workflows
 * - Deploy: Mesh deployment and update workflows
 */

const compile = require('./compile');
const deploy = require('./deploy');

module.exports = {
  // Clean workflow organization
  compile,
  deploy,
};
