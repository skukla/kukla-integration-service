/**
 * Adobe App Builder Action: Download files from storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core, Files } = require('@adobe/aio-sdk');

const { errorResponse, checkMissingRequestInputs } = require('../utils');

async function main(params) {
  const logger = Core.Logger('download-file', { level: params.LOG_LEVEL || 'info' });

  try {
    // Validate required parameters using Adobe standard
    const requiredParams = ['fileName'];
    const missingParams = checkMissingRequestInputs(params, requiredParams);
    if (missingParams) {
      return errorResponse(400, missingParams, logger);
    }

    logger.info('Starting file download', { fileName: params.fileName });

    // Initialize Adobe I/O Files
    const files = await Files.init({
      ow: {
        apihost: params.__ow_api_host,
        apiversion: params.__ow_api_version,
        namespace: params.__ow_namespace,
      },
    });

    // Clean the filename (remove public/ prefix if present)
    const cleanFileName = params.fileName.replace(/^public\//, '');

    // Read file content
    const fileContent = await files.read(cleanFileName);
    logger.info('File download completed', { fileName: params.fileName });

    // Ensure content is properly encoded
    const contentBuffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent, 'utf-8');
    const contentLength = contentBuffer.length;

    // Return download response with proper headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream', // Generic binary type for reliable downloads
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Content-Length': contentLength.toString(),
        'Accept-Ranges': 'bytes', // Enable resume capability
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: contentBuffer.toString('base64'),
      isBase64Encoded: true, // Ensure proper binary handling
    };
  } catch (error) {
    logger.error('Action failed', { error: error.message, fileName: params.fileName });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
