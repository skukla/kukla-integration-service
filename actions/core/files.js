/**
 * Core file operations module
 * @module actions/core/files
 */

const { createResponse, createHtmxError } = require('../htmx/responses');

/**
 * File operation error types
 * @enum {string}
 */
const FileErrorType = {
    NOT_FOUND: 'FILE_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INVALID_PATH: 'INVALID_PATH',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// Size formatting constants
const BYTES_PER_UNIT = 1024;
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Error class for file operations
 */
class FileOperationError extends Error {
    constructor(type, message, originalError = null) {
        super(message);
        this.name = 'FileOperationError';
        this.type = type;
        this.originalError = originalError;
    }
}

/**
 * Creates a file operation error based on the error code
 * @private
 * @param {Error} error - Original error
 * @param {string} operation - Operation description for the error message
 * @param {Object} [context] - Additional debug context
 * @returns {FileOperationError} Wrapped error
 */
function createFileError(error, operation, context = {}) {
    // Determine error type and retry capability
    let errorType = FileErrorType.UNKNOWN;
    let canRetry = false;

    // Map common error codes to types
    switch (error.code) {
        case 'FILE_NOT_FOUND':
            errorType = FileErrorType.NOT_FOUND;
            canRetry = false;
            break;
        case 'PERMISSION_DENIED':
            errorType = FileErrorType.PERMISSION_DENIED;
            canRetry = true;
            break;
        case 'EEXIST':
            errorType = FileErrorType.ALREADY_EXISTS;
            canRetry = false;
            break;
        default:
            errorType = FileErrorType.UNKNOWN;
            canRetry = true;
    }

    // Create user-friendly message with action
    const userMessage = `Failed to ${operation}: ${error.message}`;
    const userAction = canRetry ? 'Please try again or contact support if the issue persists.' : 'Please contact support for assistance.';

    return new FileOperationError(
        errorType,
        `${userMessage} ${userAction}`,
        {
            originalError: error,
            operation,
            canRetry,
            ...context
        }
    );
}

/**
 * Gets content type with fallback
 * @private
 * @param {Object} properties - File properties from SDK
 * @returns {string} Content type
 */
function getContentType(properties) {
    return properties.contentType || 'application/octet-stream';
}

/**
 * Validates a file path
 * @private
 * @param {string} path - File path to validate
 * @throws {FileOperationError} If path is invalid
 */
function validatePath(path) {
    if (!path || typeof path !== 'string') {
        throw new FileOperationError(
            FileErrorType.INVALID_PATH,
            'File path must be a non-empty string'
        );
    }

    // Prevent path traversal
    if (path.includes('..')) {
        throw new FileOperationError(
            FileErrorType.INVALID_PATH,
            'Path traversal is not allowed'
        );
    }
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
 * Formats a file size into a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const exponent = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
    const value = parseFloat((bytes / Math.pow(BYTES_PER_UNIT, exponent)).toFixed(2));
    const unit = SIZE_UNITS[exponent];
    
    return `${value} ${unit}`;
}

/**
 * Formats a date for file operations
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatFileDate(date) {
    return new Date(date).toLocaleString();
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
        lastModified: formatFileDate(properties.lastModified),
        contentType: getContentType(properties)
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
 * @returns {Promise<Array<Object>>} Array of file objects with metadata
 * @throws {FileOperationError} If operation fails
 */
async function listFiles(files, directory) {
    validatePath(directory);
    
    try {
        const filesList = await files.list(directory);
        const processedFiles = [];

        for (const fileEntry of filesList) {
            try {
                const fileMetadata = await getFileMetadata(files, fileEntry);
                processedFiles.push(fileMetadata);
            } catch (error) {
                console.warn(`Failed to get metadata for ${fileEntry.name}:`, error);
                // Continue processing other files
            }
        }

        return processedFiles;
    } catch (error) {
        throw createFileError(error, 'list files');
    }
}

/**
 * Gets file properties
 * @async
 * @param {Object} files - Files SDK instance
 * @param {string} path - Path to the file
 * @returns {Promise<Object>} File properties
 * @throws {FileOperationError} If operation fails
 */
async function getFileProperties(files, path) {
    validatePath(path);
    
    try {
        const properties = await files.getProperties(path);
        const fileContent = await files.read(path);
        
        return {
            name: removePublicPrefix(path),
            fullPath: path,
            size: formatFileSize(fileContent.length),
            lastModified: formatFileDate(properties.lastModified),
            contentType: getContentType(properties)
        };
    } catch (error) {
        throw createFileError(error, 'get file properties');
    }
}

/**
 * Creates an HTMX-compatible error response for file operations
 * @private
 * @param {FileOperationError} error - File operation error
 * @param {Object} [options] - Additional response options
 * @returns {Promise<Object>} HTMX error response
 */
async function createFileErrorResponse(error, options = {}) {
    return createHtmxError(
        error.type,
        error.message,
        {
            retryable: error.originalError?.canRetry,
            context: error.originalError,
            ...options
        }
    );
}

/**
 * Creates an HTMX-compatible success response for file operations
 * @private
 * @param {string} html - HTML content
 * @param {Object} [options] - Additional response options
 * @returns {Promise<Object>} HTMX success response
 */
async function createFileSuccessResponse(html, options = {}) {
    return createResponse({
        html,
        status: 200,
        ...options
    });
}

module.exports = {
    // Core operations
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    getFileProperties,
    
    // Formatting utilities
    removePublicPrefix,
    formatFileSize,
    formatFileDate,
    
    // Error handling
    FileOperationError,
    FileErrorType,
    createFileErrorResponse,
    createFileSuccessResponse
}; 