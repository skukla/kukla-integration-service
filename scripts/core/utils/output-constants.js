/**
 * Scripts Core Output Constants
 * DEPRECATED: Use scripts/format/utils/constants directly
 *
 * This module now re-exports from the format domain to maintain backward compatibility
 * while eliminating code duplication. New code should import from scripts/format/utils directly.
 *
 * MIGRATION PATH: Replace require('../core/utils/output-constants') with require('../format/utils')
 */

// Re-export everything from format domain
const { ICONS, COLORS, SPACING } = require('../../format/utils/constants');

module.exports = {
  ICONS,
  COLORS,
  SPACING,
};
