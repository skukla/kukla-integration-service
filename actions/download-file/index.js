/**
 * Download file action for retrieving files from storage
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');

/**
 * Main function that handles file download requests
 * 
 * @param {Object} params - Action parameters
 * @param {string} params.fileName - Name of the file to download
 * @param {string} [params.LOG_LEVEL='info'] - Logging level
 * 
 * @returns {Promise<Object>} Action response
 * @property {number} statusCode - HTTP status code (200 for success, 400/404/500 for errors)
 * @property {Object} [headers] - Response headers for successful downloads
 * @property {string} headers.Content-Type - MIME type of the file
 * @property {string} headers.Content-Disposition - Download filename instruction
 * @property {string} headers.Cache-Control - Caching directive
 * @property {string|Object} body - File content or error message
 * 
 * @throws {Error} If file operations fail
 */
async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters
    if (!params.fileName) {
      return {
        statusCode: 400,
        body: 'File name is required'
      };
    }

    // Initialize Files SDK
    logger.info('Initializing Files SDK');
    const files = await FilesLib.init();

    // Read file
    logger.info(`Reading file: ${params.fileName}`);
    const buffer = await files.read(params.fileName);

    // Get file properties
    const props = await files.getProperties(params.fileName);
    const contentType = props.contentType || 'application/octet-stream';
    const fileName = params.fileName.split('/').pop();

    // Return file content
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: buffer.toString('base64')
    };
  } catch (error) {
    logger.error('Error in download-file action:', error);
    
    // If file is not found, FilesLib will throw an error
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return {
        statusCode: 404,
        body: { error: 'File not found' }
      };
    }
    
    return {
      statusCode: 500,
      body: `Failed to download file: ${error.message}`
    };
  }
}

module.exports = {
  main
}; 