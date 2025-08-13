/**
 * Adobe App Builder Action: Delete files from storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { generateErrorHTML, createHTMLResponse } = require('../../lib/htmx');
const { deleteFile, listCsvFiles } = require('../../lib/storage');
const { errorResponse, checkMissingRequestInputs } = require('../../lib/utils');
const { validateAuth } = require('../../lib/auth/ims-validator');

async function main(params) {
  const logger = Core.Logger('delete-file', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate authentication (IMS or API key)
    const authResult = await validateAuth(params, logger);
    
    if (!authResult.authenticated) {
      return errorResponse(401, authResult.error, logger);
    }
    
    logger.info('Authentication successful', { method: authResult.method });
    
    // Validate required parameters using Adobe standard
    const requiredParams = ['fileName'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting file deletion', { fileName: params.fileName });

    // Delete file from storage
    const config = createConfig(params);
    await deleteFile(params.fileName, config);
    logger.info('File deleted successfully', { fileName: params.fileName });

    // Get updated file list and generate response
    const remainingFiles = await listCsvFiles(config);
    // For modal delete workflow, return just the file rows (not complete browser structure)
    const { generateFileBrowserHTML } = require('../../lib/htmx');
    const html = generateFileBrowserHTML(remainingFiles, params);

    return createHTMLResponse(html);
  } catch (error) {
    logger.error('Action failed', { error: error.message, fileName: params.fileName });

    // Return simplified error response for HTMX
    const errorHTML = generateErrorHTML(`Failed to delete file: ${error.message}`, 'file-deletion');
    return createHTMLResponse(errorHTML, 500);
  }
}

exports.main = main;
