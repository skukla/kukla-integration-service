/**
 * Mesh Domain Operations
 * Business operations for all mesh-related processes
 *
 * Organized by operational concern:
 * - Compilation: Template generation, configuration compilation, schema verification
 * - Deployment: Update execution, status checking, retry logic
 */

const compilation = require('./compilation');
const deployment = require('./deployment');

module.exports = {
  // Clean operation organization
  compilation,
  deployment,
};
