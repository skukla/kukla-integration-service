/**
 * File Operations
 *
 * Mid-level business logic for file operations.
 * Contains operations that coordinate file system interactions.
 */

const { formatFileSize, formatDate } = require('../../core/utils/operations/formatting');
const {
  createFileError,
  getContentType,
  validatePath,
  removePublicPrefix,
} = require('../utils/errors');

/**
 * Gets metadata for a single file
 * Business operation that safely extracts and formats file metadata.
 *
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
 * Business operation for file reading with validation and error handling.
 *
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
 * Business operation for file writing with validation and error handling.
 *
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
 * Business operation for file deletion with validation and error handling.
 *
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
 * Business operation for directory listing with metadata enrichment.
 *
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
 * Business operation for retrieving file properties with error handling.
 *
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
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  getFileProperties,
  getFileMetadata,
};
