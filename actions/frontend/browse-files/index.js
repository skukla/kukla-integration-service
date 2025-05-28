/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');
const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { 
    storage: { files: { listFiles, deleteFile, createDirectory } },
    http: { 
        createHtmxResponse, 
        createErrorResponse,
        extractActionParams 
    },
    monitoring: { 
        errors: { handleError }
    }
} = require('../../../src/core');

/**
 * Creates a simple HTML response
 * @param {string} html - HTML content
 * @param {number} [status=200] - HTTP status code
 * @returns {Object} Response object
 */
function createHtmlResponse(html, status = 200) {
    return createHtmxResponse({
        html,
        status
    });
}

/**
 * Handles GET requests for file browsing and modal operations
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Response object
 */
async function handleGetRequest(params, logger) {
    try {
        // Handle modal requests
        if (params.modal === 'delete' && params.fileName) {
            return createHtmlResponse(getDeleteModalHtml(params.fileName, params.fullPath));
        }

        // List and process files
        logger.info('Checking public directory');
        try {
            await createDirectory('public');
            logger.info('Public directory ensured');
        } catch (error) {
            // Ignore error if directory already exists
            logger.info('Public directory already exists');
        }

        // Get file list with metadata using shared operations
        logger.info('Listing files from public directory');
        const allFiles = await listFiles('public');
        
        // Filter for CSV files
        const csvFiles = allFiles.filter(file => file.name.endsWith('.csv'));
        logger.info(`Found ${csvFiles.length} CSV files`);

        // Return the file list HTML
        return createHtmlResponse(getFileListHtml(csvFiles));
    } catch (error) {
        logger.error('Error in GET request:', error);
        return handleError(error);
    }
}

/**
 * Handles DELETE requests for file deletion
 * @param {Object} params - Request parameters
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Response object
 */
async function handleDeleteRequest(params, logger) {
    try {
        const fileName = params.fileName;
        if (!fileName) {
            return createErrorResponse('File name is required', 400);
        }

        logger.info(`Deleting file: ${fileName}`);
        await deleteFile(fileName);
        return createHtmlResponse('');
    } catch (error) {
        logger.error('Error in DELETE request:', error);
        return handleError(error);
    }
}

/**
 * Main function that handles file browsing and management
 * @param {Object} rawParams - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(rawParams) {
    const params = extractActionParams(rawParams);
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        // Route request based on HTTP method
        switch (params.__ow_method) {
            case 'get':
                return handleGetRequest(params, logger);
            case 'delete':
                return handleDeleteRequest(params, logger);
            default:
                return createErrorResponse('Method not allowed', 405);
        }
    } catch (error) {
        logger.error('Error in main:', error);
        return handleError(error);
    }
}

module.exports = {
    main
}; 