/**
 * Adobe App Builder Action: Download files from S3 storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const createConfig = require('../../config');
const { createS3Client } = require('../../lib/storage');
const { errorResponse, checkMissingRequestInputs } = require('../../lib/utils');

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

    // Get configuration for S3
    const config = createConfig(params);

    // Clean the filename (remove public/ prefix if present)
    const cleanFileName = params.fileName.replace(/^public\//, '');

    // Download from S3 using centralized client
    const s3Client = createS3Client(config);
    const getCommand = new GetObjectCommand({
      Bucket: config.s3.bucketName,
      Key: cleanFileName,
    });

    const response = await s3Client.send(getCommand);
    const fileContent = await response.Body.transformToByteArray();

    logger.info('File download completed', { fileName: params.fileName });

    // Ensure content is properly encoded
    const contentBuffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent, 'utf-8');

    // Determine content type and encoding based on file type (using master branch approach)
    const isCsvFile = cleanFileName.endsWith('.csv');
    const contentType = isCsvFile ? 'text/csv' : 'application/octet-stream';

    // Return download response with proper headers (simplified approach from master)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Cache-Control': 'no-cache',
      },
      body: isCsvFile ? contentBuffer.toString('utf8') : contentBuffer.toString('base64'),
      isBase64Encoded: !isCsvFile,
    };
  } catch (error) {
    logger.error('Action failed', { error: error.message, fileName: params.fileName });
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
