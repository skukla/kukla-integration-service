/**
 * Environment detection catalog
 * @module core/environment
 *
 * Provides environment detection utilities organized by operational concern:
 * - Detection: Core environment detection logic
 * - CLI: Adobe CLI workspace detection
 * - Validation: Environment validation utilities
 */

// Import operations modules
const cli = require('./operations/cli');
const detection = require('./operations/detection');
const validation = require('./operations/validation');

module.exports = {
  // Export individual functions for backward compatibility
  detectEnvironment: detection.detectEnvironment,
  isStaging: validation.isStaging,
  isProduction: validation.isProduction,

  // Export organized by operation type
  detection,
  cli,
  validation,
};
