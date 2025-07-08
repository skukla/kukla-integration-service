/**
 * App Builder Storage Operations
 *
 * Mid-level business logic for Adobe I/O App Builder storage operations.
 * Contains provider-specific business operations and coordination.
 */

const { createAppBuilderStorageWrapper } = require('../utils/storage-factories');
const { validateAppBuilderEnvironment, createAppBuilderClient } = require('../utils/validation');

/**
 * Initialize Adobe I/O Files storage
 * Business operation that coordinates App Builder storage setup.
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters for logging
 * @returns {Promise<Object>} Storage client wrapper
 * @throws {Error} If App Builder environment validation fails
 */
async function initializeAppBuilderStorage(config, params = {}) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient(params);
  return createAppBuilderStorageWrapper(files, config);
}

module.exports = {
  initializeAppBuilderStorage,
};
