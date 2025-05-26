/**
 * Browse files action for managing product export files
 * @module browse-files
 */

const { Core } = require('@adobe/aio-sdk');
const { getDeleteModalHtml, getFileListHtml } = require('./templates');
const { 
    storage: { listFiles },
    http: { createHtmxResponse, createErrorResponse }
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
 * Creates an error response
 * @param {string} message - Error message
 * @param {number} [status=500] - HTTP status code
 * @returns {Object} Response object
 */
function createErrorResponse(message, status = 500) {
    return createHtmxResponse({
        html: `
            <div class="error-message" role="alert">
                <p>${message}</p>
            </div>
        `,
        status
    });
}

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
            return createHtmlResponse(getDeleteModalHtml(params.fileName, params.fullPath));
        }

        // List and process files
        logger.info('Checking public directory');
        try {
            await files.createDirectory('public');
            logger.info('Public directory ensured');
        } catch (error) {
            // Ignore error if directory already exists
            logger.info('Public directory already exists');
        }

        // Get file list with metadata using shared operations
        logger.info('Listing files from public directory');
        const allFiles = await listFiles(files, 'public');
        
        // Filter for CSV files
        const csvFiles = allFiles.filter(file => file.name.endsWith('.csv'));
        logger.info(`Found ${csvFiles.length} CSV files`);

        // Return the file list HTML
        return createHtmlResponse(getFileListHtml(csvFiles));
    } catch (error) {
        logger.error('Error in GET request:', error);
        
        if (error.isFileOperationError) {
            switch (error.type) {
                case FileErrorType.PERMISSION_DENIED:
                    return createErrorResponse('File storage credentials not configured properly', 400);
                case FileErrorType.INVALID_PATH:
                    return createErrorResponse(error.message, 400);
                default:
                    return createErrorResponse(`Failed to list files: ${error.message}`);
            }
        }

        return createErrorResponse(error.message);
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
            return createErrorResponse('File name is required', 400);
        }

        logger.info(`Deleting file: ${fileName}`);
        await deleteFile(files, fileName);
        return createHtmlResponse('');
    } catch (error) {
        logger.error('Error in DELETE request:', error);

        if (error.isFileOperationError) {
            switch (error.type) {
                case FileErrorType.NOT_FOUND:
                    return createErrorResponse(`File not found: ${params.fileName}`, 404);
                case FileErrorType.INVALID_PATH:
                    return createErrorResponse(error.message, 400);
                default:
                    return createErrorResponse(`Failed to delete file: ${error.message}`);
            }
        }

        return createErrorResponse(error.message);
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
                return createErrorResponse('Method not allowed', 405);
        }
    } catch (error) {
        logger.error('Error initializing Files SDK:', error);
        return createErrorResponse(error.message);
    }
}

module.exports = {
    main
}; 