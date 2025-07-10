/**
 * Mesh Domain
 * Complete mesh functionality organized as a cohesive domain
 *
 * Following Domain-Driven Design principles, this domain contains all
 * mesh-related operations and workflows in a single, cohesive module:
 *
 * Architecture:
 * scripts/mesh/
 * ├── operations/     # Business operations (compilation, deployment)
 * ├── workflows/      # High-level orchestration (compile, deploy)
 * └── index.js        # Domain catalog (this file)
 */

const operations = require('./operations');
const workflows = require('./workflows');

module.exports = {
  // Clean domain organization
  operations,
  workflows,
};
