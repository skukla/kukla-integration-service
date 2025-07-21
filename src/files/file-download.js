/**
 * Files File Download
 * Complete file download capability with content reading and response building
 */

const { cleanFileName } = require('./shared/file-utils');
const { initializeStorageStrategy } = require('./shared/storage-strategies');
const { response } = require('../shared/http/responses');
const { formatFileSize } = require('../shared/utils/formatting');

// Business Workflows

/**
 * Complete file download workflow with comprehensive error handling
 * @purpose Execute complete file download workflow with content retrieval and response building
 * @param {string} fileName - Name of the file to download
 * @param {Object} config - Complete configuration object
 * @param {Object} params - Action parameters containing credentials
 * @param {Object} [options={}] - Download options including response format preferences
 * @returns {Promise<Object>} Complete download response with file content and headers
 * @throws {Error} When file access fails or file doesn't exist
 * @usedBy download-file action
 * @config storage.provider, storage.directory, files.mimeTypes
 */
async function downloadFileWithResponse(fileName, config, params, options = {}) {
  try {
    // Step 1: Clean and validate filename
    const cleanedFileName = cleanFileName(fileName, config);

    // Step 2: Initialize storage and read file content
    const fileContent = await readFileContent(cleanedFileName, config, params);

    // Step 3: Get file metadata for response headers
    const metadata = await getFileMetadataForDownload(cleanedFileName, config, params);

    // Step 4: Build complete download response with proper headers
    return buildDownloadResponse(fileName, fileContent, metadata, config, options);
  } catch (error) {
    return buildDownloadErrorResponse(error, fileName);
  }
}

/**
 * Basic file download workflow
 * @purpose Download file content with basic response formatting
 * @param {string} fileName - Name of the file to download
 * @param {Object} config - Configuration object with storage settings
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Download response with file content
 * @usedBy download-file action, basic download scenarios
 * @config storage.provider, storage.directory
 */
async function downloadFile(fileName, config, params) {
  try {
    // Step 1: Clean filename and read content
    const cleanedFileName = cleanFileName(fileName, config);
    const fileContent = await readFileContent(cleanedFileName, config, params);

    // Step 2: Build basic download response
    return buildBasicDownloadResponse(fileName, fileContent, config);
  } catch (error) {
    throw new Error(`File download failed: ${error.message}`);
  }
}

/**
 * Get file content without download response formatting
 * @purpose Retrieve raw file content for processing or analysis
 * @param {string} fileName - Name of the file to read
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Buffer|string>} Raw file content
 * @usedBy File processing workflows, content analysis
 */
async function getFileContent(fileName, config, params) {
  const cleanedFileName = cleanFileName(fileName, config);
  return await readFileContent(cleanedFileName, config, params);
}

// Feature Operations

/**
 * Read file content from storage
 * @purpose Coordinate file reading from configured storage provider
 * @param {string} fileName - Clean filename to read
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Buffer|string>} File content
 * @usedBy downloadFileWithResponse, downloadFile, getFileContent
 */
async function readFileContent(fileName, config, params) {
  const storage = await initializeStorageStrategy(config, params);
  return await storage.read(fileName);
}

/**
 * Get file metadata for download response
 * @purpose Retrieve file metadata to build proper download response headers
 * @param {string} fileName - Clean filename
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} File metadata including size, content type, etc.
 * @usedBy downloadFileWithResponse
 */
async function getFileMetadataForDownload(fileName, config, params) {
  try {
    const storage = await initializeStorageStrategy(config, params);
    const properties = await storage.getProperties(fileName);

    return {
      size: properties.size || 0,
      contentType: properties.contentType || detectContentType(fileName, config),
      lastModified: properties.lastModified,
      exists: true,
    };
  } catch (error) {
    return {
      size: 0,
      contentType: detectContentType(fileName, config),
      lastModified: new Date().toISOString(),
      exists: false,
    };
  }
}

// Feature Utilities

/**
 * Detect content type from filename
 * @purpose Determine MIME type based on file extension
 * @param {string} fileName - Filename to analyze
 * @param {Object} config - Configuration object with MIME type mappings
 * @returns {string} Detected MIME type
 * @usedBy getFileMetadataForDownload, buildDownloadResponse
 */
function detectContentType(fileName, config) {
  if (!fileName) return 'application/octet-stream';

  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = config.files.mimeTypes;

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Build complete download response with proper headers
 * @purpose Create standardized download response with comprehensive headers
 * @param {string} fileName - Original filename for download
 * @param {Buffer|string} fileContent - File content
 * @param {Object} metadata - File metadata including size and content type
 * @param {Object} config - Configuration object
 * @param {Object} options - Response options
 * @returns {Object} Complete download response
 * @usedBy downloadFileWithResponse
 */
function buildDownloadResponse(fileName, fileContent, metadata, config, options = {}) {
  const contentLength = Buffer.isBuffer(fileContent)
    ? fileContent.length
    : Buffer.byteLength(fileContent);
  const contentType = metadata.contentType || detectContentType(fileName, config);

  const headers = {
    'Content-Type': contentType,
    'Content-Length': contentLength.toString(),
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'private, no-cache',
  };

  // Add last modified if available
  if (metadata.lastModified) {
    headers['Last-Modified'] = new Date(metadata.lastModified).toUTCString();
  }

  // Add custom headers if specified
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return response.success(
    {
      content: fileContent,
      fileName,
      size: contentLength,
      formattedSize: formatFileSize(contentLength),
      contentType,
      metadata,
    },
    'File downloaded successfully',
    {
      headers,
      statusCode: 200,
    }
  );
}

/**
 * Build basic download response
 * @purpose Create simple download response without comprehensive metadata
 * @param {string} fileName - Original filename for download
 * @param {Buffer|string} fileContent - File content
 * @param {Object} config - Configuration object
 * @returns {Object} Basic download response
 * @usedBy downloadFile
 */
function buildBasicDownloadResponse(fileName, fileContent, config) {
  const contentLength = Buffer.isBuffer(fileContent)
    ? fileContent.length
    : Buffer.byteLength(fileContent);
  const contentType = detectContentType(fileName, config);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
    body: fileContent,
  };
}

/**
 * Build download error response
 * @purpose Create standardized error response for download failures
 * @param {Error} error - Error that occurred during download
 * @param {string} fileName - Filename that failed to download
 * @returns {Object} Error response
 * @usedBy downloadFileWithResponse
 */
function buildDownloadErrorResponse(error, fileName) {
  const isNotFound =
    error.message.includes('not found') ||
    error.message.includes('NoSuchKey') ||
    error.message.includes('does not exist');

  const statusCode = isNotFound ? 404 : 500;
  const errorMessage = isNotFound
    ? `File '${fileName}' not found`
    : `Download failed: ${error.message}`;

  return response.error(errorMessage, {
    fileName,
    errorType: isNotFound ? 'FILE_NOT_FOUND' : 'DOWNLOAD_ERROR',
    originalError: error.message,
    statusCode,
  });
}

/**
 * Validate download parameters
 * @purpose Ensure all required parameters are present and valid for download
 * @param {string} fileName - Filename to validate
 * @param {Object} config - Configuration object to validate
 * @param {Object} params - Action parameters to validate
 * @throws {Error} When validation fails
 * @usedBy downloadFileWithResponse, downloadFile
 */
function validateDownloadParams(fileName, config, params) {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Filename is required and must be a string');
  }

  if (!config || !config.storage) {
    throw new Error('Storage configuration is required');
  }

  if (!config.storage.provider) {
    throw new Error('Storage provider must be specified');
  }

  if (!params) {
    throw new Error('Action parameters are required for storage authentication');
  }
}

module.exports = {
  // Business workflows
  downloadFileWithResponse,
  downloadFile,
  getFileContent,

  // Feature operations
  readFileContent,
  getFileMetadataForDownload,

  // Feature utilities
  detectContentType,
  buildDownloadResponse,
  buildBasicDownloadResponse,
  buildDownloadErrorResponse,
  validateDownloadParams,
};
