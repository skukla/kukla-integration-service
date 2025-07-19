/**
 * Files Shared Validation Utilities
 * Validation functions shared across 3+ features in the files domain
 *
 * Consolidated from file-deletion/validation.js and other file features
 */

/**
 * Validate file type is allowed for file operations
 * @purpose Check if file type is permitted based on configuration
 * @param {string} fileName - Name of the file to validate
 * @param {Object} config - Configuration object with allowed file types
 * @returns {Object} Validation result
 * @usedBy file-deletion, file-download, file-browser (3+ features)
 */
function validateFileType(fileName, config) {
  if (!fileName || typeof fileName !== 'string') {
    return {
      isValid: false,
      errors: ['File name must be a non-empty string'],
    };
  }

  const allowedExtensions = config.files?.extensions || ['.csv', '.txt', '.json'];
  const fileExtension = getFileExtension(fileName);

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      errors: [
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      ],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Validate basic file operation parameters
 * @purpose Check common parameters for file operations
 * @param {Object} params - Parameters to validate
 * @param {Array} requiredParams - List of required parameter names
 * @returns {Object} Validation result
 * @usedBy Multiple file features for parameter validation
 */
function validateBasicFileParameters(params, requiredParams = ['fileName']) {
  const errors = [];

  if (!params || typeof params !== 'object') {
    return {
      isValid: false,
      errors: ['Parameters must be an object'],
      missingParams: requiredParams,
    };
  }

  const missingParams = [];
  requiredParams.forEach((param) => {
    if (!params[param] || params[param] === '') {
      errors.push(`Missing required parameter: ${param}`);
      missingParams.push(param);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    missingParams,
    validatedParams: requiredParams.filter((param) => !missingParams.includes(param)),
  };
}

/**
 * Get file extension from filename
 * @purpose Extract file extension for validation
 * @param {string} fileName - File name to process
 * @returns {string} File extension including dot (e.g., '.csv')
 */
function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.substring(lastDotIndex).toLowerCase();
}

module.exports = {
  validateFileType,
  validateBasicFileParameters,
  getFileExtension,
};
