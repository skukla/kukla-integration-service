/**
 * Adobe App Builder Action: Download files from storage
 * Follows Adobe standard patterns with direct exports.main
 */

const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
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

    // Get configuration and use the same storage provider as other actions
    const config = createConfig(params);
    const provider = config.storage.provider;

    // Clean the filename (remove public/ prefix if present)
    const cleanFileName = params.fileName.replace(/^public\//, '');

    let fileContent;

    if (provider === 's3') {
      // Use S3 storage
      const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
      const s3Config = {
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
      };
      const s3Client = new S3Client(s3Config);
      const getCommand = new GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: cleanFileName,
      });
      const response = await s3Client.send(getCommand);
      fileContent = await response.Body.transformToByteArray();
    } else {
      // Use Adobe I/O Files
      const { Files } = require('@adobe/aio-sdk');
      const files = await Files.init({
        ow: {
          namespace: params.__ow_namespace,
          auth: params.__ow_api_key,
        },
      });
      fileContent = await files.read(cleanFileName);
    }

    logger.info('File download completed', { fileName: params.fileName, provider });

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
