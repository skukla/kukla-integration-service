/**
 * File Deletion - Validation Sub-module
 * All file deletion validation utilities
 */

const { cleanFileName } = require('../shared/file-utils');
const { initializeStorageStrategy } = require('../shared/storage-strategies');

// Validation Workflows

/**
 * Complete deletion request validation
 * @purpose Validate all aspects of a file deletion request
 * @param {string} fileName - Name of the file to delete
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @param {Object} [options={}] - Validation options
 * @returns {Promise<void>} Resolves if validation passes
 * @throws {Error} When validation fails
 * @usedBy deleteFileWithValidation
 */
async function validateDeletionRequest(fileName, config, params, options = {}) {
  // Step 1: Validate basic parameters
  validateBasicDeletionParameters(fileName, config, params);

  // Step 2: Validate file type is allowed for deletion
  validateFileTypeAllowed(fileName, config);

  // Step 3: Validate file is not protected
  validateFileNotProtected(fileName, config);

  // Step 4: Validate file exists (if required)
  if (options.checkExistence !== false) {
    await validateFileExists(fileName, config, params);
  }
}

// Validation Utilities

/**
 * Validate basic deletion parameters
 * @purpose Ensure required parameters are present and valid
 * @param {string} fileName - Filename to validate
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @throws {Error} When basic parameters are invalid
 * @usedBy validateDeletionRequest
 */
function validateBasicDeletionParameters(fileName, config, params) {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Filename is required and must be a string');
  }

  if (!config || !config.storage) {
    throw new Error('Storage configuration is required');
  }

  if (!params) {
    throw new Error('Action parameters are required for storage authentication');
  }
}

/**
 * Validate file type is allowed for deletion
 * @purpose Check if file extension is in allowed deletions list
 * @param {string} fileName - Filename to validate
 * @param {Object} config - Configuration object
 * @throws {Error} When file type is not allowed for deletion
 * @usedBy validateDeletionRequest
 */
function validateFileTypeAllowed(fileName, config) {
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const allowedDeletions = config.files.allowedDeletions;

  // Check if file is in allowed deletion list
  const isAllowedDeletion = allowedDeletions.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName);
    }
    return pattern === fileName;
  });

  if (!isAllowedDeletion) {
    throw new Error(`Deletion not allowed for file type: .${fileExtension}`);
  }
}

/**
 * Validate file is not protected
 * @purpose Check if file matches any protected patterns
 * @param {string} fileName - Filename to validate
 * @param {Object} config - Configuration object
 * @throws {Error} When file matches protected patterns
 * @usedBy validateDeletionRequest
 */
function validateFileNotProtected(fileName, config) {
  const protectedPatterns = config.files.protectedPatterns;

  for (const pattern of protectedPatterns) {
    if (fileName.includes(pattern)) {
      throw new Error(`Cannot delete protected file: ${fileName}`);
    }
  }
}

/**
 * Validate file exists in storage
 * @purpose Check if file exists before attempting deletion
 * @param {string} fileName - Filename to validate
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @throws {Error} When file does not exist
 * @usedBy validateDeletionRequest
 */
async function validateFileExists(fileName, config, params) {
  try {
    const storageStrategy = await initializeStorageStrategy(config, params);
    const cleanedFileName = cleanFileName(fileName, config);
    const exists = await storageStrategy.fileExists(cleanedFileName);

    if (!exists) {
      throw new Error(`File not found: ${fileName}`);
    }
  } catch (error) {
    if (error.message.includes('File not found')) {
      throw error;
    }
    throw new Error(`Failed to check file existence: ${error.message}`);
  }
}

module.exports = {
  validateDeletionRequest,
  validateBasicDeletionParameters,
  validateFileTypeAllowed,
  validateFileNotProtected,
  validateFileExists,
};
