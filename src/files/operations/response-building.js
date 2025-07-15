/**
 * Response Building Operations
 *
 * Mid-level business logic for building standardized file operation responses.
 * Contains operations that construct consistent response formats across all file operations.
 */

/**
 * Build standardized storage response
 * Business operation that constructs consistent storage response format.
 *
 * @param {Object} storageResult - Result from CSV storage strategy operation
 * @param {Object} storage - Storage wrapper instance
 * @param {Object} config - Configuration object
 * @returns {Object} Standardized storage response
 */
function buildStorageResponse(storageResult, storage, config) {
  const properties = { ...storageResult.result.properties };

  // Add provider-specific metadata
  if (storage.provider === 's3' && config.storage.s3?.bucket) {
    properties.bucket = config.storage.s3.bucket;
  }

  // Add directory from configuration for display purposes
  if (config.storage.directory) {
    properties.directory = config.storage.directory;
  }

  return {
    stored: true,
    provider: storage.provider,
    fileName: storageResult.result.fileName,
    url: storageResult.result.url,
    downloadUrl: storageResult.result.downloadUrl,
    presignedUrl: storageResult.result.presignedUrl || null,
    properties,
    management: {
      fileExisted: storageResult.fileExisted,
      urlGenerated: storageResult.urlGenerated,
      operation: storageResult.operation,
    },
  };
}

/**
 * Build storage error response
 * Business operation that constructs consistent error response format.
 *
 * @param {Error} error - Error that occurred during storage
 * @returns {Object} Standardized error response
 */
function buildStorageErrorResponse(error) {
  return {
    stored: false,
    error: {
      message: error.message,
      type: error.type || 'STORAGE_ERROR',
    },
  };
}

/**
 * Build export CSV response with storage metadata
 * Business operation that constructs response for CSV export workflows.
 *
 * @param {Object} storageResult - Storage operation result
 * @returns {Object} Export response with download and storage metadata
 */
function buildExportCsvResponse(storageResult) {
  if (!storageResult.stored) {
    throw new Error(
      `Storage operation failed: ${storageResult.error?.message || 'Unknown storage error'}`
    );
  }

  return {
    downloadUrl: storageResult.downloadUrl,
    storage: {
      provider: storageResult.provider,
      location: storageResult.fileName,
      properties: storageResult.properties,
    },
    storageResult,
  };
}

/**
 * Build file download response with proper content type detection
 * Business operation that constructs download response with appropriate headers.
 *
 * @param {string} fileName - Name of the file being downloaded
 * @param {Buffer} fileContent - File content buffer
 * @param {Object} config - Configuration object with file type settings
 * @returns {Object} Download response with proper headers and encoding
 */
function buildDownloadResponse(fileName, fileContent, config) {
  const { removePublicPrefix } = require('../utils/paths');
  const cleanFileName = removePublicPrefix(fileName);

  // Determine content type and encoding based on file type
  const isTextFile = fileName.endsWith(config.files.extensions.csv);
  const contentType = isTextFile ? config.files.contentTypes.csv : config.files.contentTypes.binary;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      'Cache-Control': 'no-cache',
    },
    body: isTextFile ? fileContent.toString('utf8') : fileContent.toString('base64'),
    isBase64Encoded: !isTextFile,
  };
}

/**
 * Build download error response
 * Business operation that constructs download error response.
 *
 * @param {Error} error - Error that occurred during download
 * @param {string} fileName - File name that failed to download
 * @returns {Object} Download error response
 */
function buildDownloadErrorResponse(error, fileName) {
  if (error.message.includes('not found') || error.code === 'NoSuchKey') {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: `File not found: ${fileName}`,
      }),
    };
  }

  // Re-throw unexpected errors for higher-level handling
  throw error;
}

/**
 * Build presigned URL response
 * Business operation that constructs presigned URL response with metadata.
 *
 * @param {Object} presignedUrlResult - Result from presigned URL generation
 * @param {Object} storage - Storage wrapper instance
 * @param {Object} options - Original options passed to generation
 * @param {string} fileName - File name for the URL
 * @returns {Object} Presigned URL response with metadata
 */
function buildPresignedUrlResponse(presignedUrlResult, storage, options, fileName) {
  if (!presignedUrlResult.success) {
    throw new Error(`Presigned URL generation failed: ${presignedUrlResult.error.message}`);
  }

  return {
    success: true,
    presignedUrl: presignedUrlResult.presignedUrl,
    expiresAt: presignedUrlResult.expiresAt,
    expiresIn: presignedUrlResult.expiresIn,
    provider: storage.provider,
    urlType: options.urlType || 'external',
    permissions: options.permissions || 'r',
    useCase: options.useCase || 'system',
    metadata: {
      fileName,
      generatedAt: new Date().toISOString(),
      provider: storage.provider,
      ...presignedUrlResult,
    },
  };
}

/**
 * Build presigned URL error response
 * Business operation that constructs presigned URL error response.
 *
 * @param {Error} error - Error that occurred during URL generation
 * @param {Object} options - Original options passed to generation
 * @returns {Object} Presigned URL error response
 */
function buildPresignedUrlErrorResponse(error, options) {
  return {
    success: false,
    error: {
      message: error.message,
      type: 'PRESIGNED_URL_GENERATION_ERROR',
      useCase: options.useCase || 'system',
    },
  };
}

module.exports = {
  buildStorageResponse,
  buildStorageErrorResponse,
  buildExportCsvResponse,
  buildDownloadResponse,
  buildDownloadErrorResponse,
  buildPresignedUrlResponse,
  buildPresignedUrlErrorResponse,
};
