/**
 * Storage Strategies - Functional Strategy Pattern Implementation
 *
 * Pure function strategies for different storage providers.
 * Uses composition over inheritance and pure functions.
 *
 * Each strategy is a pure function that returns a storage interface.
 * No classes, no inheritance - just functional composition.
 */

const { createAppBuilderStorageWrapper } = require('../utils/storage-factories');
const { createS3StorageWrapper } = require('../utils/storage-factories');
const { validateAppBuilderEnvironment, createAppBuilderClient } = require('../utils/validation');
const { validateS3Config, createS3Client } = require('../utils/validation');

/**
 * App Builder Storage Strategy
 * Pure function that creates App Builder storage interface.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage interface
 */
async function appBuilderStorageStrategy(config, params) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient(params);
  return createAppBuilderStorageWrapper(files, config);
}

/**
 * S3 Storage Strategy
 * Pure function that creates S3 storage interface.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage interface
 */
async function s3StorageStrategy(config, params) {
  const { s3Config, accessKeyId, secretAccessKey } = validateS3Config(config, params);
  const s3Client = createS3Client(s3Config, accessKeyId, secretAccessKey);
  return createS3StorageWrapper(s3Client, s3Config, config);
}

/**
 * Storage Strategy Registry
 * Pure object mapping strategy names to strategy functions.
 * No classes - just function references.
 */
const STORAGE_STRATEGIES = {
  'app-builder': appBuilderStorageStrategy,
  s3: s3StorageStrategy,
};

/**
 * Strategy Selector Function
 * Pure function that selects and executes the appropriate storage strategy.
 *
 * @param {string} provider - Storage provider name
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage interface
 * @throws {Error} If strategy not found
 */
async function selectStorageStrategy(provider, config, params) {
  const strategy = STORAGE_STRATEGIES[provider];

  if (!strategy) {
    throw new Error(
      `Unknown storage provider: ${provider}. Available: ${Object.keys(STORAGE_STRATEGIES).join(', ')}`
    );
  }

  return await strategy(config, params);
}

/**
 * Add Storage Strategy
 * Pure function to extend strategies without modifying existing code.
 *
 * @param {string} name - Strategy name
 * @param {Function} strategyFunction - Pure strategy function
 * @returns {Object} Updated strategies object (immutable)
 */
function addStorageStrategy(name, strategyFunction) {
  return {
    ...STORAGE_STRATEGIES,
    [name]: strategyFunction,
  };
}

/**
 * Get Available Storage Strategies
 * Pure function that returns available strategy names.
 *
 * @returns {Array<string>} Available strategy names
 */
function getAvailableStorageStrategies() {
  return Object.keys(STORAGE_STRATEGIES);
}

module.exports = {
  // Strategy functions
  appBuilderStorageStrategy,
  s3StorageStrategy,

  // Strategy registry and selector
  STORAGE_STRATEGIES,
  selectStorageStrategy,

  // Extension functions
  addStorageStrategy,
  getAvailableStorageStrategies,
};
