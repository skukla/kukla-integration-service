/**
 * Scripts Core Module Loading Operations
 * Module loading operations with cache management
 */

const fs = require('fs');
const path = require('path');

/**
 * Load Node.js module with fresh cache
 * @param {string} modulePath - Path to module file
 * @returns {Object} Loaded module
 */
function loadModuleWithFreshCache(modulePath) {
  const resolvedPath = path.resolve(modulePath);

  // Clear require cache to ensure fresh load
  delete require.cache[resolvedPath];

  return require(resolvedPath);
}

/**
 * Check if module file exists
 * @param {string} modulePath - Path to module file
 * @returns {boolean} True if module exists
 */
function moduleExists(modulePath) {
  return fs.existsSync(path.resolve(modulePath));
}

/**
 * Load module with existence check
 * @param {string} modulePath - Path to module file
 * @param {string} [errorMessage] - Custom error message
 * @returns {Object} Loaded module
 */
function loadModule(modulePath, errorMessage) {
  if (!moduleExists(modulePath)) {
    throw new Error(errorMessage || `Module not found: ${modulePath}`);
  }

  return loadModuleWithFreshCache(modulePath);
}

module.exports = {
  loadModuleWithFreshCache,
  moduleExists,
  loadModule,
};
