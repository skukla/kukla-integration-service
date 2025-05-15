/**
 * Download file action for retrieving stored CSV files
 * @module download-file
 * @description Handles secure file downloads from Adobe I/O Files storage
 */

const { Core } = require('@adobe/aio-sdk');
const FilesLib = require('@adobe/aio-lib-files');

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
        body: { error: 'Missing required parameter: fileName' }
      };
    }

    // Construct the full file path in the public directory
    const publicFileName = `public/${params.fileName}`;
    logger.info(`Attempting to download file: ${publicFileName}`);
    
    // Initialize Files SDK and read file
    const files = await FilesLib.init();
    const content = await files.read(publicFileName);
    
    // Return file content with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${params.fileName}"`,
        'Cache-Control': 'no-cache'
      },
      body: content.toString()
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
      body: { error: 'Failed to download file' }
    };
  }
}

exports.main = main; 