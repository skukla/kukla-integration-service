/**
 * Scripts Core Infrastructure Catalog
 * @module scripts/core
 *
 * This catalog exports essential shared infrastructure used across script domains:
 * - Spinner and UI operations
 * - Script framework utilities
 * - Simple formatting functions
 *
 * Following Strategic Duplication approach - domain-specific utilities moved to their domains,
 * only truly shared infrastructure remains in core.
 *
 */

// Import modules
const format = require('./formatting');
const scriptFramework = require('./operations/script-framework');
const spinner = require('./operations/spinner');

module.exports = {
  // Structured exports for organized access
  spinner,
  scriptFramework,
  formatting: format,
};
