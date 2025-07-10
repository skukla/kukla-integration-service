/**
 * Scripts Core Basic Formatters
 * DEPRECATED: Use scripts/format domain directly
 *
 * This module now re-exports from the format domain to maintain backward compatibility
 * while eliminating code duplication. New code should import from scripts/format directly.
 *
 * MIGRATION PATH: Replace require('../core/utils/basic-formatters') with require('../format')
 */

// Re-export everything from format domain
const format = require('../../format');

module.exports = {
  success: format.success,
  error: format.error,
  warning: format.warning,
  info: format.info,
  progress: format.progress,
  step: format.step,
  text: format.text,
  muted: format.muted,
  bold: format.bold,
  highlight: format.highlight,
  url: format.url,
};
