/**
 * Scripts Core Infrastructure Catalog
 * @module scripts/core
 *
 * This catalog exports all core infrastructure used across script domains:
 * - Environment detection and management
 * - Spinner and UI operations
 * - String and format utilities
 * - Hash and file operations
 * - Common script utilities
 *
 * Following the same pattern as src/core/ - provides shared infrastructure
 * that eliminates duplication across build, deploy, and test domains.
 */

// Import operations modules
const environment = require('./operations/environment');
const hash = require('./operations/hash');
const spinner = require('./operations/spinner');
// Import utilities modules
const file = require('./utils/file');
const format = require('./utils/format');
const string = require('./utils/string');

module.exports = {
  // Environment utilities
  detectScriptEnvironment: environment.detectScriptEnvironment,
  // Spinner operations
  createSpinner: spinner.createSpinner,
  formatSpinnerSuccess: spinner.formatSpinnerSuccess,
  // Hash operations
  calculateFileHash: hash.calculateFileHash,
  calculateObjectHash: hash.calculateObjectHash,
  // Format utilities
  formatSuccess: format.formatSuccess,
  formatError: format.formatError,
  formatWarning: format.formatWarning,
  formatInfo: format.formatInfo,
  // String utilities
  capitalize: string.capitalize,
  camelToKebab: string.camelToKebab,
  kebabToCamel: string.kebabToCamel,
  truncate: string.truncate,
  // File utilities
  fileExists: file.fileExists,
  readJsonFile: file.readJsonFile,
  getFileExtension: file.getFileExtension,
  getBasename: file.getBasename,
  joinPath: file.joinPath,
  // Structured exports for organized access
  environment,
  spinner,
  hash,
  format,
  string,
  file,
};
