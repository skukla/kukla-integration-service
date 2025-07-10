/**
 * Core Mesh Output Templates
 * DEPRECATED: Use scripts/format domain directly
 *
 * This module now re-exports from the format domain to maintain backward compatibility
 * while eliminating code duplication. New code should import from scripts/format directly.
 *
 * MIGRATION PATH: Replace require('../core/operations/mesh-templates') with require('../format')
 */

// Re-export everything from format domain
const format = require('../../format');

module.exports = {
  meshUpdateStart: format.meshUpdateStart,
  meshPollingStart: format.meshPollingStart,
  meshStartEmphasis: format.meshStartEmphasis,
  meshCompleteEmphasis: format.meshCompleteEmphasis,
};
