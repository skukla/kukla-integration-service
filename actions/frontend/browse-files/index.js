/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');
const { htmlResponse } = require('./utils/ui/htmx');
const { errorResponse } = require('../../shared/http/response');
const { getFileDisplayDetails } = require('./utils/file/display');
const { getDeleteModalHtml, getFileListHtml } = require('./templates');

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} params - Request parameters
 * @param {Object} files - Files SDK instance
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(params, files, logger) {
    try {
        // Handle modal requests
        if (params.modal === 'delete' && params.fileName) {
            return htmlResponse(getDeleteModalHtml(params.fileName, params.fullPath));
        }

        // List and process files
        logger.info('Listing files from public directory');
        const filesList = await files.list('public');
        logger.info(`Found ${filesList.length} total files`);

        // Filter for CSV files and get their details
        const csvFiles = filesList.filter(file => file.name.endsWith('.csv'));
        logger.info(`Found ${csvFiles.length} CSV files`);

        const fileDetails = await Promise.all(
            csvFiles.map(async file => {
                logger.info(`Getting properties for file: ${file.name}`);
                const props = await files.getProperties(file.name);
                logger.info('File properties:', JSON.stringify(props, null, 2));
                return getFileDisplayDetails(file, props);
            })
        );

        // Return the file list HTML
        return htmlResponse(getFileListHtml(fileDetails));
    } catch (error) {
        logger.error('Error in GET request:', error);
        return errorResponse(500, `Failed to list files: ${error.message}`);
    }
}

/**
 * Handles DELETE requests for file deletion
 * @param {Object} params - Request parameters
 * @param {Object} files - Files SDK instance
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Response object
 */
async function handleDeleteRequest(params, files, logger) {
    try {
        const fileName = params.fileName;
        if (!fileName) {
            return errorResponse(400, 'File name is required');
        }

        logger.info(`Deleting file: ${fileName}`);
        await files.delete(fileName);
        return htmlResponse('');
    } catch (error) {
        logger.error('Error in DELETE request:', error);
        return errorResponse(500, `Failed to delete file: ${error.message}`);
    }
}

/**
 * Main function that handles file browsing and management
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        logger.info('Initializing Files SDK');
        const files = await FilesLib.init();

        // Route request based on HTTP method
        switch (params.__ow_method) {
            case 'get':
                return handleGetRequest(params, files, logger);
            case 'delete':
                return handleDeleteRequest(params, files, logger);
            default:
                return errorResponse(405, 'Method not allowed');
        }
    } catch (error) {
        logger.error('Error initializing Files SDK:', error);
        return errorResponse(500, `Failed to initialize file system: ${error.message}`);
    }
}

module.exports = {
    main
}; 