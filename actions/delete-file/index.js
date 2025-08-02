/**
 * Adobe App Builder Action: Delete files from storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { generateFileDeletionResponse, generateErrorHTML, createHTMLResponse } = require('../htmx');
const { deleteFile, listCsvFiles } = require('../storage');
const { errorResponse, checkMissingRequestInputs } = require('../utils');

async function main(params) {
  const logger = Core.Logger('delete-file', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters using Adobe standard
    const requiredParams = ['fileName'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting file deletion', { fileName: params.fileName });

    // Step 1: Delete file from storage (simplified)
    const config = createConfig(params);
    await deleteFile(params.fileName, params, config);
    logger.info('File deleted successfully', { fileName: params.fileName });

    // Step 2: Get updated file list and generate response
    const remainingFiles = await listCsvFiles(params, config);
    const html = generateFileDeletionResponse(params.fileName, remainingFiles, config);

    return createHTMLResponse(html);
  } catch (error) {
    logger.error('Action failed', { error: error.message, fileName: params.fileName });

    // Return simplified error response for HTMX
    const errorHTML = generateErrorHTML(`Failed to delete file: ${error.message}`, 'file-deletion');
    return createHTMLResponse(errorHTML, 500);
  }
}

exports.main = main;
