/**
 * Action-specific operations for download-file
 * @module download-file/lib/operations
 */

/**
 * Validates download request and prepares filename
 * @param {Object} allParams - Merged action parameters
 * @param {Object} logger - Logger instance
 * @param {Object} core - Core utilities
 * @param {Object} files - Files domain
 * @returns {string} Clean filename for download
 */
function validateAndPrepareDownload(allParams, logger, core, files) {
  logger.info('Starting download request:', { fileName: allParams.fileName });

  // Validate required parameters
  const missingInputs = core.checkMissingParams(allParams, ['fileName']);
  if (missingInputs) {
    logger.error('Missing required inputs:', { missingInputs });
    throw new Error(missingInputs);
  }

  // Extract clean filename
  const cleanFileName = files.extractCleanFilename(allParams.fileName);
  logger.info('Clean filename extracted:', {
    original: allParams.fileName,
    clean: cleanFileName,
  });

  return cleanFileName;
}

/**
 * Initializes storage and retrieves file metadata
 * @param {string} cleanFileName - Clean filename to download
 * @param {Object} context - Action context
 * @returns {Promise<Object>} Storage instance and file properties
 */
async function initializeStorageAndGetFile(cleanFileName, context) {
  const { files, config, params, logger } = context;

  // Initialize storage provider
  logger.info('Initializing storage provider');
  const storage = await files.initializeStorage(config, params);
  logger.info('Storage provider initialized:', { provider: storage.provider });

  // Get file properties
  logger.info(`Getting properties for file: ${cleanFileName}`);
  const fileProps = await files.getFileProperties(storage, cleanFileName);
  logger.info('File properties retrieved:', {
    name: fileProps.name,
    size: fileProps.size,
    contentType: fileProps.contentType,
  });

  return { storage, fileProps };
}

/**
 * Reads file content and creates download response
 * @param {string} cleanFileName - Clean filename to read
 * @param {Object} storage - Storage instance
 * @param {Object} fileProps - File properties
 * @param {Object} logger - Logger instance
 * @param {Object} files - Files domain
 * @returns {Promise<Object>} Download response
 */
async function readFileAndCreateResponse(cleanFileName, storage, fileProps, logger, files) {
  // Read file content
  logger.info(`Reading file content: ${cleanFileName}`);
  const buffer = await files.readFile(storage, cleanFileName);
  logger.info('File content read successfully', {
    contentLength: buffer.length,
    fileName: cleanFileName,
  });

  // Return file download response
  logger.info('Sending file response');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': fileProps.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileProps.name}"`,
      'Cache-Control': 'no-cache',
      'X-Download-Success': 'true',
      'X-File-Name': fileProps.name,
    },
    body: buffer.toString('utf8'),
  };
}

module.exports = {
  validateAndPrepareDownload,
  initializeStorageAndGetFile,
  readFileAndCreateResponse,
};
