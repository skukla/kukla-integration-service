/**
 * CSV Storage Operations
 *
 * Mid-level business logic for CSV file storage operations.
 * Contains operations that handle file existence strategy and storage coordination.
 */

const { updateContentOnly } = require('./content-only');

/**
 * Store CSV with smart file existence strategy
 * Business operation that determines whether to create new file or update existing content.
 *
 * @param {Object} storage - Storage wrapper instance
 * @param {string} fileName - Name of the file to store
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object
 * @param {Object} [options] - Storage options including useCase for access patterns
 * @returns {Promise<Object>} Storage result with operation metadata
 */
async function storeCsvWithStrategy(storage, fileName, csvData, config, options = {}) {
  try {
    // Check if file already exists
    const existingFile = await storage.getProperties(fileName);
    const fileExists = existingFile !== null;

    let result;
    let urlGenerated = false;

    if (!fileExists) {
      // File doesn't exist → Create new file + generate presigned URL
      result = await storage.write(fileName, csvData, options);
      urlGenerated = true;
    } else {
      // File exists → Update content only, preserve existing presigned URL
      result = await updateContentOnly(storage, fileName, csvData, config);
      urlGenerated = false;
    }

    return {
      result,
      fileExisted: fileExists,
      urlGenerated,
      operation: fileExists ? 'content-update' : 'new-file',
    };
  } catch (error) {
    throw new Error(`CSV storage strategy failed: ${error.message}`);
  }
}

/**
 * Validate CSV file storage parameters
 * Business operation that validates required parameters for CSV storage.
 *
 * @param {string} fileName - File name to validate
 * @param {string} csvData - CSV data to validate
 * @param {Object} config - Configuration to validate
 * @throws {Error} If validation fails
 */
function validateCsvStorageParams(fileName, csvData, config) {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid fileName: must be a non-empty string');
  }

  if (!csvData || typeof csvData !== 'string') {
    throw new Error('Invalid csvData: must be a non-empty string');
  }

  if (!config || !config.storage) {
    throw new Error('Invalid config: storage configuration required');
  }

  if (!config.storage.csv || !config.storage.csv.filename) {
    throw new Error('Invalid config: CSV storage configuration required');
  }
}

/**
 * Prepare CSV storage parameters with defaults
 * Business operation that normalizes and prepares storage parameters.
 *
 * @param {string} csvData - CSV content to store
 * @param {Object} config - Configuration object
 * @param {string} [fileName] - Optional file name (defaults to config)
 * @param {Object} [options] - Optional storage options
 * @returns {Object} Normalized storage parameters
 */
function prepareCsvStorageParams(csvData, config, fileName, options = {}) {
  const finalFileName = fileName || config.storage.csv.filename;

  validateCsvStorageParams(finalFileName, csvData, config);

  return {
    fileName: finalFileName,
    csvData,
    options: {
      useCase: options.useCase || 'user',
      ...options,
    },
  };
}

module.exports = {
  storeCsvWithStrategy,
  validateCsvStorageParams,
  prepareCsvStorageParams,
};
