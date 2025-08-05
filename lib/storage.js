/**
 * S3 Storage Utilities for Adobe App Builder Actions
 * Simplified S3-only implementation following Adobe standards
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Create S3 client with configuration
 * Centralized client factory to avoid duplication
 */
function createS3Client(config) {
  return new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });
}

/**
 * Store CSV data to S3 and return download URL
 * Simplified S3-only implementation
 *
 * @param {string} csvContent - CSV content to store
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Storage result with download URL
 */
async function storeCsv(csvContent, config) {
  const fileName = config.products.defaultFilename;
  const bucketName = config.s3?.bucketName;

  if (!bucketName) {
    return {
      stored: false,
      error: { message: 'S3 bucket name not configured' },
    };
  }

  try {
    const s3Client = createS3Client(config);

    // Upload file to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(csvContent),
      ContentType: 'text/csv',
    });

    await s3Client.send(uploadCommand);

    // Generate presigned URL (7 days expiration - S3 maximum)
    const expiresIn = 604800; // 7 days
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const downloadUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn });

    return {
      stored: true,
      provider: 's3',
      fileName,
      downloadUrl,
      properties: { size: csvContent.length },
      management: { expiresIn },
    };
  } catch (error) {
    return {
      stored: false,
      error: { message: error.message },
    };
  }
}

/**
 * List CSV files in S3 bucket
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of file objects
 */
async function listCsvFiles(config) {
  const bucketName = config.s3?.bucketName;

  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  try {
    const s3Client = createS3Client(config);

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 100,
    });

    const response = await s3Client.send(listCommand);
    const files = response.Contents || [];

    return files
      .filter((file) => file.Key.endsWith('.csv'))
      .map((file) => ({
        name: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        path: file.Key,
      }));
  } catch (error) {
    console.warn('S3 file listing failed:', error.message);
    return [];
  }
}

/**
 * Delete file from S3
 * @param {string} fileName - File name to delete
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFile(fileName, config) {
  const bucketName = config.s3?.bucketName;

  if (!bucketName) {
    return {
      success: false,
      error: 'S3 bucket name not configured',
    };
  }

  try {
    const s3Client = createS3Client(config);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    await s3Client.send(deleteCommand);

    return {
      success: true,
      message: `File ${fileName} deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  storeCsv,
  listCsvFiles,
  deleteFile,
  createS3Client,
};
