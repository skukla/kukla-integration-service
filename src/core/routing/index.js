/**
 * URL Management catalog
 * @module core/routing
 *
 * Provides consistent URL building across backend and frontend contexts
 * organized by operational concern:
 * - Runtime: Adobe I/O Runtime action URLs
 * - Commerce: Adobe Commerce API URLs
 */

// Import operations modules
const commerce = require('./operations/commerce');
const runtime = require('./operations/runtime');

module.exports = {
  // Export individual functions for backward compatibility
  buildActionUrl: runtime.buildActionUrl,
  buildRuntimeUrl: runtime.buildRuntimeUrl,
  buildCommerceUrl: commerce.buildCommerceUrl,

  // Export organized by operation type
  runtime,
  commerce,
};
