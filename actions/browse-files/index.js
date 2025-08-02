/**
 * Adobe App Builder Action: Browse and list CSV files in storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { generateFileBrowserHTML, createHTMLResponse } = require('../htmx');
const { listCsvFiles } = require('../storage');
const { errorResponse, checkMissingRequestInputs } = require('../utils');

async function main(params) {
  const logger = Core.Logger('browse-files', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters using Adobe standard
    const requiredParams = [];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting file browse');

    // Step 1: Get list of CSV files from storage (simplified)
    const config = createConfig(params);
    const fileList = await listCsvFiles(params, config);
    logger.info('Retrieved file list', { count: fileList.length });

    // Step 2: Generate and return HTML for HTMX
    const html = generateFileBrowserHTML(fileList, config);

    return createHTMLResponse(html);
  } catch (error) {
    logger.error('Action failed', { error: error.message, stack: error.stack });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
