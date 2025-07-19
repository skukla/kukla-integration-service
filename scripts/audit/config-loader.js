/**
 * Audit Configuration Loader
 * Centralized loading and validation of audit pattern configurations
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration file paths
const CONFIG_DIR = path.join(__dirname, 'patterns');
const CONFIG_FILES = {
  sectionHeaders: 'section-headers.json',
  exportOrganization: 'export-organization.json',
  namespaceImports: 'namespace-imports.json',
  jsdocExclusions: 'jsdoc-exclusions.json',
};

// Cached configurations
let configCache = {};

/**
 * Load audit configuration from JSON files
 * @purpose Load and validate audit pattern configurations with caching
 * @param {string} configName - Name of configuration to load
 * @returns {Promise<Object>} Loaded and validated configuration
 * @usedBy All audit functions
 */
async function loadAuditConfig(configName) {
  // Return cached config if available
  if (configCache[configName]) {
    return configCache[configName];
  }

  const configFile = CONFIG_FILES[configName];
  if (!configFile) {
    throw new Error(`Unknown audit configuration: ${configName}`);
  }

  const configPath = path.join(CONFIG_DIR, configFile);

  try {
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Validate config structure
    validateConfigStructure(configName, config);

    // Cache and return
    configCache[configName] = config;
    return config;
  } catch (error) {
    throw new Error(`Failed to load audit config ${configName}: ${error.message}`);
  }
}

/**
 * Load all audit configurations
 * @purpose Load all audit pattern configurations at once
 * @returns {Promise<Object>} Object with all configurations
 * @usedBy Audit initialization
 */
async function loadAllAuditConfigs() {
  const configs = {};

  for (const [configName] of Object.entries(CONFIG_FILES)) {
    configs[configName] = await loadAuditConfig(configName);
  }

  return configs;
}

/**
 * Get flattened patterns array
 * @purpose Extract patterns array from nested configuration structure
 * @param {Object} config - Configuration object
 * @param {string} patternKey - Key path to patterns (e.g., 'workflowPatterns.patterns')
 * @returns {Array} Flattened array of patterns
 * @usedBy Pattern matching functions
 */
function getFlattenedPatterns(config, patternKey) {
  const keys = patternKey.split('.');
  let result = config;

  for (const key of keys) {
    result = result[key];
    if (!result) {
      return [];
    }
  }

  return Array.isArray(result) ? result : [];
}

/**
 * Get all namespace import patterns
 * @purpose Extract all allowed namespace import patterns
 * @param {Object} config - Namespace imports configuration
 * @returns {Array} Array of all allowed namespace import patterns
 * @usedBy Import organization audit
 */
function getAllNamespacePatterns(config) {
  const categories = config.allowedNamespaceImports.categories;
  const allPatterns = [];

  for (const category of Object.values(categories)) {
    if (Array.isArray(category.patterns)) {
      allPatterns.push(...category.patterns);
    }
  }

  return allPatterns;
}

/**
 * Get all JSDoc exclusion names
 * @purpose Extract all variable names to exclude from JSDoc detection
 * @param {Object} config - JSDoc exclusions configuration
 * @returns {Array} Array of all excluded variable names
 * @usedBy JSDoc documentation audit
 */
function getAllJSDocExclusions(config) {
  const categories = config.excludedVariableNames.categories;
  const allExclusions = [];

  for (const category of Object.values(categories)) {
    if (Array.isArray(category)) {
      allExclusions.push(...category);
    }
  }

  return allExclusions;
}

/**
 * Validate section headers configuration
 * @purpose Validate section headers config structure
 * @param {Object} config - Configuration object to validate
 * @throws {Error} When configuration structure is invalid
 */
function validateSectionHeadersConfig(config) {
  if (!config.workflowPatterns || !config.operationPatterns || !config.utilityPatterns) {
    throw new Error('Section headers config missing required pattern categories');
  }
}

/**
 * Validate export organization configuration
 * @purpose Validate export organization config structure
 * @param {Object} config - Configuration object to validate
 * @throws {Error} When configuration structure is invalid
 */
function validateExportOrganizationConfig(config) {
  if (!config.workflowComments || !config.operationComments) {
    throw new Error('Export organization config missing required comment patterns');
  }
}

/**
 * Validate namespace imports configuration
 * @purpose Validate namespace imports config structure
 * @param {Object} config - Configuration object to validate
 * @throws {Error} When configuration structure is invalid
 */
function validateNamespaceImportsConfig(config) {
  if (!config.allowedNamespaceImports || !config.allowedNamespaceImports.categories) {
    throw new Error('Namespace imports config missing required categories');
  }
}

/**
 * Validate JSDoc exclusions configuration
 * @purpose Validate JSDoc exclusions config structure
 * @param {Object} config - Configuration object to validate
 * @throws {Error} When configuration structure is invalid
 */
function validateJSDocExclusionsConfig(config) {
  if (!config.excludedVariableNames || !config.exemptDirectories) {
    throw new Error('JSDoc exclusions config missing required properties');
  }
}

/**
 * Validate configuration structure
 * @purpose Ensure configuration has required properties and valid structure
 * @param {string} configName - Name of configuration being validated
 * @param {Object} config - Configuration object to validate
 * @throws {Error} When configuration structure is invalid
 */
function validateConfigStructure(configName, config) {
  if (!config.description || !config.version) {
    throw new Error(`Config ${configName} missing required metadata (description, version)`);
  }

  // Specific validation by config type
  const validators = {
    sectionHeaders: validateSectionHeadersConfig,
    exportOrganization: validateExportOrganizationConfig,
    namespaceImports: validateNamespaceImportsConfig,
    jsdocExclusions: validateJSDocExclusionsConfig,
  };

  const validator = validators[configName];
  if (validator) {
    validator(config);
  }
}

/**
 * Clear configuration cache
 * @purpose Clear cached configurations for testing or reloading
 * @usedBy Tests and development utilities
 */
function clearConfigCache() {
  configCache = {};
}

module.exports = {
  // Configuration loading
  loadAuditConfig,
  loadAllAuditConfigs,

  // Pattern extraction utilities
  getFlattenedPatterns,
  getAllNamespacePatterns,
  getAllJSDocExclusions,

  // Utilities
  clearConfigCache,
};
