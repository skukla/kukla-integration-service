/**
 * Scripts Core Infrastructure Catalog
 * @module scripts/core
 *
 * This catalog exports all core infrastructure used across script domains:
 * - Environment detection and management
 * - Spinner and UI operations
 * - String and file utilities
 * - Hash operations
 * - Common script utilities
 *
 * Following the same pattern as src/core/ - provides shared infrastructure
 * that eliminates duplication across build, deploy, and test domains.
 *
 */

// Import modules
const formatDomain = require('../format');
const environment = require('./operations/environment');
const hash = require('./operations/hash');
const scriptFramework = require('./operations/script-framework');
const spinner = require('./operations/spinner');
const file = require('./utils/file');
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
  string,
  file,
  scriptFramework,

  // Format domain integration (PREFERRED)
  formatting: formatDomain,
};
