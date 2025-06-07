/**
 * Core routing utilities
 * @module core/routing
 */

// Re-export from the URL module
const { buildRuntimeUrl, buildCommerceUrl } = require('../url');

module.exports = {
  buildRuntimeUrl,
  buildCommerceUrl,
};
