/**
 * Delete file action for removing files from storage
 * @module delete-file
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');
const { checkMissingRequestInputs } = require('../../../src/core/validation');
const { response: { error: errorResponse, success: successResponse } } = require('../../../src/core/http');
const { deleteFile, FileOperationError, FileErrorType } = require('../../../src/core/files');

/**
 * Main function that handles file deletion
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        // Validate required parameters
        const requiredParams = ['fileName'];
        const missingParams = checkMissingRequestInputs(params, requiredParams);
        if (missingParams) {
            return errorResponse({
                message: missingParams
            }, 400);
        }

        // Initialize Files SDK
        logger.info('Initializing Files SDK');
        const files = await FilesLib.init();

        // Delete the file using shared operations
        logger.info(`Deleting file: ${params.fileName}`);
        await deleteFile(files, params.fileName);

        // Return empty response for HTMX to remove the row
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: ''
        };
    } catch (error) {
        logger.error('Error in delete-file action:', error);

        // Handle specific file operation errors
        if (error instanceof FileOperationError) {
            switch (error.type) {
                case FileErrorType.NOT_FOUND:
                    return errorResponse({
                        message: `File not found: ${params.fileName}`
                    }, 404);
                case FileErrorType.INVALID_PATH:
                    return errorResponse({
                        message: error.message
                    }, 400);
                default:
                    return errorResponse({
                        message: `Failed to delete file: ${error.message}`
                    }, 500);
            }
        }

        return errorResponse({
            message: `Failed to delete file: ${error.message}`
        }, 500);
    }
}

module.exports = {
    main
}; 