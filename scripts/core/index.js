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
 * - Output formatting operations
 *
 * Following the same pattern as src/core/ - provides shared infrastructure
 * that eliminates duplication across build, deploy, and test domains.
 */

// Import modules
const environment = require('./operations/environment');
const formatting = require('./operations/formatting');
const hash = require('./operations/hash');
const meshTemplates = require('./operations/mesh-templates');
const scriptFramework = require('./operations/script-framework');
const spinner = require('./operations/spinner');
const basicFormatters = require('./utils/basic-formatters');
const file = require('./utils/file');
const format = require('./utils/format');
const outputConstants = require('./utils/output-constants');
const string = require('./utils/string');

module.exports = {
  // Environment utilities
  detectEnvironment: environment.detectScriptEnvironment,
  detectScriptEnvironment: environment.detectScriptEnvironment,

  // Script framework
  parseArgs: scriptFramework.parseArgs,
  executeScript: scriptFramework.executeScript,

  // Spinner operations
  createSpinner: spinner.createSpinner,
  updateSpinner: spinner.updateSpinner,
  succeedSpinner: spinner.succeedSpinner,
  failSpinner: spinner.failSpinner,
  warnSpinner: spinner.warnSpinner,

  // Hash operations
  calculateFileHash: hash.calculateFileHash,
  calculateObjectHash: hash.calculateObjectHash,

  // Format utilities (legacy)
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
  scriptFramework,
  formatting,
  meshTemplates,
  outputConstants,
  basicFormatters,
};
