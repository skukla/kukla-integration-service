/**
 * Core file operations module
 * @module actions/core/files
 */

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
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
        throw new FileOperationError(
            error.code === 'FILE_NOT_FOUND' ? FileErrorType.NOT_FOUND : FileErrorType.UNKNOWN,
            `Failed to read file: ${error.message}`,
            error
        );
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
        throw new FileOperationError(
            FileErrorType.UNKNOWN,
            `Failed to write file: ${error.message}`,
            error
        );
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
        throw new FileOperationError(
            error.code === 'FILE_NOT_FOUND' ? FileErrorType.NOT_FOUND : FileErrorType.UNKNOWN,
            `Failed to delete file: ${error.message}`,
            error
        );
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
        const results = [];

        for (const file of filesList) {
            try {
                const props = await files.getProperties(file.name);
                results.push({
                    name: removePublicPrefix(file.name),
                    fullPath: file.name,
                    size: formatFileSize(props.size),
                    lastModified: formatFileDate(props.lastModified),
                    contentType: props.contentType || 'application/octet-stream'
                });
            } catch (error) {
                console.warn(`Failed to get properties for ${file.name}:`, error);
                // Continue with next file
            }
        }

        return results;
    } catch (error) {
        throw new FileOperationError(
            FileErrorType.UNKNOWN,
            `Failed to list files: ${error.message}`,
            error
        );
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
        const props = await files.getProperties(path);
        return {
            name: removePublicPrefix(path),
            fullPath: path,
            size: formatFileSize(props.size),
            lastModified: formatFileDate(props.lastModified),
            contentType: props.contentType || 'application/octet-stream'
        };
    } catch (error) {
        throw new FileOperationError(
            error.code === 'FILE_NOT_FOUND' ? FileErrorType.NOT_FOUND : FileErrorType.UNKNOWN,
            `Failed to get file properties: ${error.message}`,
            error
        );
    }
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
    FileErrorType
}; 