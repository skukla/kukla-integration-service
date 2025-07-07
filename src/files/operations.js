/**
 * Core File Operations
 * @module files/operations
 * @description Pure functions for file operations and error handling
 */

const { formatFileSize, formatDate } = require('../shared').utils;
const {
  storage: { FileErrorType },
} = require('../shared').errors;

/**
 * Creates a file operation error object
 * @param {string} type - Error type from FileErrorType
 * @param {string} message - Error message
 * @param {Error} [originalError] - Original error that caused this
 * @returns {Object} File operation error object
 */
function createFileOperationError(type, message, originalError = null) {
  return {
    name: 'FileOperationError',
    message,
    type,
    originalError,
    isFileOperationError: true,
  };
}

/**
 * Determines if an object is a file operation error
 * @param {Object} error - Error to check
 * @returns {boolean} True if it's a file operation error
 */
function isFileOperationError(error) {
  return error && error.isFileOperationError === true;
}

/**
 * Maps an error code to error type and retry capability
 * @param {string} errorCode - Error code to map
 * @returns {Object} Error type and retry information
 */
function mapErrorCodeToType(errorCode) {
  switch (errorCode) {
    case 'FILE_NOT_FOUND':
      return {
        type: FileErrorType.NOT_FOUND,
        canRetry: false,
      };
    case 'PERMISSION_DENIED':
      return {
        type: FileErrorType.PERMISSION_DENIED,
        canRetry: true,
      };
    case 'EEXIST':
      return {
        type: FileErrorType.ALREADY_EXISTS,
        canRetry: false,
      };
    default:
      return {
        type: FileErrorType.UNKNOWN,
        canRetry: true,
      };
  }
}

/**
 * Creates a user-friendly error message
 * @param {string} operation - Operation description
 * @param {string} errorMessage - Technical error message
 * @param {boolean} canRetry - Whether the operation can be retried
 * @returns {string} User-friendly error message
 */
function createUserFriendlyErrorMessage(operation, errorMessage, canRetry) {
  const baseMessage = `Failed to ${operation}: ${errorMessage}`;
  const action = canRetry
    ? 'Please try again or contact support if the issue persists.'
    : 'Please contact support for assistance.';
  return `${baseMessage} ${action}`;
}

/**
 * Creates a file operation error based on the error code
 * @param {Error} error - Original error
 * @param {string} operation - Operation description for the error message
 * @param {Object} [context] - Additional debug context
 * @returns {Object} File operation error object
 */
function createFileError(error, operation, context = {}) {
  const { type, canRetry } = mapErrorCodeToType(error.code);
  const userMessage = createUserFriendlyErrorMessage(operation, error.message, canRetry);
  return createFileOperationError(type, userMessage, {
    originalError: error,
    operation,
    canRetry,
    ...context,
  });
}

/**
 * Gets content type with fallback
 * @param {Object} properties - File properties from SDK
 * @returns {string} Content type
 */
function getContentType(properties) {
  return properties.contentType || 'application/octet-stream';
}

/**
 * Validates a file path and returns any errors
 * @param {string} path - File path to validate
 * @returns {Object|null} File operation error if invalid, null if valid
 */
function validatePath(path) {
  if (!path || typeof path !== 'string') {
    return createFileOperationError(
      FileErrorType.INVALID_PATH,
      'File path must be a non-empty string'
    );
  }
  // Prevent path traversal
  if (path.includes('..')) {
    return createFileOperationError(FileErrorType.INVALID_PATH, 'Path traversal is not allowed');
  }
  return null;
}

/**
 * Removes the 'public/' prefix from a file path
 * @param {string} filePath - File path that may contain 'public/' prefix
 * @returns {string} File path without 'public/' prefix
 */
function removePublicPrefix(filePath) {
  return filePath.replace(/^public\//, '');
}

/**
 * Gets metadata for a single file
 * @private
 * @async
 * @param {Object} files - Files SDK instance
 * @param {Object} fileEntry - File entry from list operation
 * @returns {Promise<Object>} Processed file metadata
 */
async function getFileMetadata(files, fileEntry) {
  const properties = await files.getProperties(fileEntry.name);
  const fileContent = await files.read(fileEntry.name);
  return {
    name: removePublicPrefix(fileEntry.name),
    fullPath: fileEntry.name,
    size: formatFileSize(fileContent.length),
    lastModified: formatDate(properties.lastModified),
    contentType: getContentType(properties),
  };
}

/**
 * Reads a file
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} path - Path to the file
 * @returns {Promise<Buffer>} File contents as a buffer
 * @throws {FileOperationError} If operation fails
 */
async function readFile(files, path) {
  validatePath(path);
  try {
    return await files.read(path);
  } catch (error) {
    throw createFileError(error, 'read file');
  }
}

/**
 * Writes a file
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} path - Path to write the file to
 * @param {Buffer|string} content - Content to write
 * @returns {Promise<void>}
 * @throws {FileOperationError} If operation fails
 */
async function writeFile(files, path, content) {
  validatePath(path);
  try {
    await files.write(path, content);
  } catch (error) {
    throw createFileError(error, 'write file');
  }
}

/**
 * Deletes a file
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} path - Path to the file to delete
 * @returns {Promise<void>}
 * @throws {FileOperationError} If operation fails
 */
async function deleteFile(files, path) {
  validatePath(path);
  try {
    await files.delete(path);
  } catch (error) {
    throw createFileError(error, 'delete file');
  }
}

/**
 * Lists files in a directory
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} directory - Directory to list
 * @returns {Promise<Array<Object>>} Array of file metadata objects
 * @throws {FileOperationError} If operation fails
 */
async function listFiles(files, directory) {
  validatePath(directory);
  try {
    const fileList = await files.list();
    const filteredFiles = fileList.filter((file) => file.name.startsWith(directory));

    // Get metadata for each file
    const filesWithMetadata = await Promise.all(
      filteredFiles.map(async (file) => {
        try {
          return await getFileMetadata(files, file);
        } catch (error) {
          // If we can't read file metadata, include basic info
          return {
            name: removePublicPrefix(file.name),
            fullPath: file.name,
            size: 'Unknown',
            lastModified: 'Unknown',
            contentType: 'application/octet-stream',
          };
        }
      })
    );

    return filesWithMetadata;
  } catch (error) {
    throw createFileError(error, 'list files');
  }
}

/**
 * Gets file properties
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} path - Path to the file
 * @returns {Promise<Object>} File properties object
 * @throws {FileOperationError} If operation fails
 */
async function getFileProperties(files, path) {
  validatePath(path);
  try {
    const properties = await files.getProperties(path);
    return {
      name: removePublicPrefix(path),
      size: properties.size,
      lastModified: properties.lastModified,
      contentType: getContentType(properties),
    };
  } catch (error) {
    throw createFileError(error, 'get file properties');
  }
}

module.exports = {
  // Error handling utilities
  createFileOperationError,
  isFileOperationError,
  mapErrorCodeToType,
  createUserFriendlyErrorMessage,
  createFileError,

  // File operations
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  getFileProperties,

  // Utilities
  getContentType,
  validatePath,
  removePublicPrefix,
  getFileMetadata,
};
