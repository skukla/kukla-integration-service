/**
 * Storage Utilities for Adobe App Builder Actions
 */

const { Files } = require('@adobe/aio-sdk');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Store CSV data and return download URL
 * Simplified replacement for the over-engineered storeCsvFile orchestration
 *
 * @param {string} csvContent - CSV content to store
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Storage result with download URL
 */
async function storeCsv(csvContent, params, config) {
  const provider = config.storage.provider;
  const fileName = config.products.defaultFilename;

  try {
    if (provider === 'app-builder') {
      return await storeWithAppBuilder(csvContent, fileName, params);
    } else if (provider === 's3') {
      return await storeWithS3(csvContent, fileName, params, config);
    } else {
      throw new Error(`Unknown storage provider: ${provider}`);
    }
  } catch (error) {
    return {
      stored: false,
      error: { message: error.message },
    };
  }
}

/**
 * Store file using Adobe I/O Files SDK (App Builder)
 */
async function storeWithAppBuilder(csvContent, fileName, params) {
  const files = await Files.init({
    ow: {
      namespace: params.__ow_namespace,
      auth: params.__ow_api_key,
    },
  });

  // Write the file
  await files.write(fileName, Buffer.from(csvContent));

  // Generate presigned URL with maximum expiration time
  const expiresIn = getMaxExpirationTime('app-builder');
  const downloadUrl = await files.generatePresignURL(fileName, { expiresIn });

  return {
    stored: true,
    provider: 'app-builder',
    fileName,
    downloadUrl,
    properties: { size: csvContent.length },
    management: { expiresIn },
  };
}

/**
 * Store file using AWS S3
 */
async function storeWithS3(csvContent, fileName, params, config) {
  const s3Config = {
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  };

  const s3Client = new S3Client(s3Config);
  const bucketName = config.s3?.bucketName;

  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  // Upload file
  const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: Buffer.from(csvContent),
    ContentType: 'text/csv',
  });

  await s3Client.send(uploadCommand);

  // Generate presigned URL with maximum expiration time
  const expiresIn = getMaxExpirationTime('s3');
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
}

/**
 * Get maximum expiration time based on storage provider capabilities
 * @param {string} provider - Storage provider ('s3' or 'app-builder')
 * @returns {number} Maximum expiration time in seconds
 */
function getMaxExpirationTime(provider) {
  switch (provider) {
    case 's3':
      return 604800; // 7 days (S3 maximum)
    case 'app-builder':
      return 86400; // 24 hours (App Builder maximum)
    default:
      return 3600; // 1 hour safe default
  }
}

/**
 * List CSV files in storage
 * Simplified replacement for getCsvFiles
 */
async function listCsvFiles(params, config) {
  const provider = config.storage.provider;

  if (provider === 'app-builder') {
    return await listAppBuilderFiles(params);
  } else if (provider === 's3') {
    return await listS3Files(params, config);
  } else {
    throw new Error(`Unknown storage provider: ${provider}`);
  }
}

/**
 * List files from Adobe I/O Files
 */
async function listAppBuilderFiles(params) {
  const files = await Files.init({
    ow: {
      namespace: params.__ow_namespace,
      auth: params.__ow_api_key,
    },
  });

  const fileList = await files.list();

  // Handle case where fileList is undefined or null
  if (!fileList || !Array.isArray(fileList)) {
    return [];
  }

  return fileList.filter((file) => file.name.endsWith('.csv'));
}

/**
 * List files from S3
 */
async function listS3Files(params, config) {
  const s3Config = {
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  };

  const s3Client = new S3Client(s3Config);
  const bucketName = config.s3?.bucketName;

  const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
  const response = await s3Client.send(listCommand);

  // Handle case where Contents is undefined or null
  if (!response.Contents || !Array.isArray(response.Contents)) {
    return [];
  }

  return response.Contents.filter((obj) => obj.Key.endsWith('.csv')).map((obj) => ({
    name: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
}

/**
 * Delete file from storage
 */
async function deleteFile(fileName, params, config) {
  const provider = config.storage.provider;

  if (provider === 'app-builder') {
    const files = await Files.init({
      ow: {
        namespace: params.__ow_namespace,
        auth: params.__ow_api_key,
      },
    });
    await files.delete(fileName);
  } else if (provider === 's3') {
    const s3Config = {
      region: config.s3?.region || 'us-east-1',
      credentials: {
        accessKeyId: config.s3?.accessKeyId || params.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.s3?.secretAccessKey || params.AWS_SECRET_ACCESS_KEY,
      },
    };
    const s3Client = new S3Client(s3Config);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.s3?.bucketName,
      Key: fileName,
    });
    await s3Client.send(deleteCommand);
  } else {
    throw new Error(`Unknown storage provider: ${provider}`);
  }
}

module.exports = {
  storeCsv,
  listCsvFiles,
  deleteFile,
};
