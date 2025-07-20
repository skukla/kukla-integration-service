/**
 * Files Shared Storage Strategies
 * Simple storage provider switching with direct implementations
 */

const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const {
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const { createUrlBuilders } = require('../../shared/routing/url-factory');

/**
 * Initialize storage based on configuration
 * @param {Object} config - Configuration object with storage provider settings
 * @param {Object} params - Action parameters for authentication
 * @returns {Promise<Object>} Storage interface with all required methods
 */
async function initializeStorageStrategy(config, params) {
  const provider = config.storage.provider;

  switch (provider) {
    case 'app-builder':
      return await createAppBuilderStorage(config);
    case 's3':
      return await createS3Storage(config, params);
    default:
      throw new Error(`Unknown storage provider: ${provider}. Available: app-builder, s3`);
  }
}

/**
 * Create App Builder storage interface
 */
async function createAppBuilderStorage(config) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient();
  const { downloadUrl } = createUrlBuilders(config);

  return {
    async list() {
      return await appBuilderList(files);
    },

    async read(fileName) {
      return await files.read(fileName);
    },

    async deleteFile(fileName) {
      await files.delete(fileName);
      return { success: true, fileName };
    },

    async getFileMetadata(fileName) {
      return await appBuilderGetMetadata(files, fileName);
    },

    async fileExists(fileName) {
      return await appBuilderFileExists(files, fileName);
    },

    async getProperties(fileName) {
      return await files.getProperties(fileName);
    },

    async store(storageParams) {
      return await appBuilderStore(files, config, storageParams, downloadUrl);
    },
  };
}

// App Builder Helper Functions

async function appBuilderList(files) {
  const fileList = await files.list();
  return fileList.map((file) => ({
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    contentType: file.contentType,
    url: file.url,
  }));
}

async function appBuilderGetMetadata(files, fileName) {
  const properties = await files.getProperties(fileName);
  return {
    name: fileName,
    size: properties.size,
    lastModified: properties.lastModified,
    contentType: properties.contentType,
  };
}

async function appBuilderFileExists(files, fileName) {
  try {
    await files.getProperties(fileName);
    return true;
  } catch (error) {
    return false;
  }
}

async function appBuilderStore(files, config, storageParams, downloadUrl) {
  const fullFileName = `${config.storage.directory}/${storageParams.fileName}`;
  await files.write(fullFileName, storageParams.content);

  return {
    downloadUrl: downloadUrl(storageParams.fileName),
    storage: 'app-builder',
    fileName: storageParams.fileName,
    properties: {
      size: storageParams.size,
      contentType: storageParams.mimeType,
    },
    management: {
      fileExisted: false,
      urlGenerated: true,
    },
  };
}

/**
 * Create S3 storage interface
 */
async function createS3Storage(config, params) {
  validateS3Environment(config, params);
  const s3Client = await createS3Client(config, params);
  const bucket = config.storage.s3.bucket;
  const prefix = config.storage.s3.prefix || '';
  const { downloadUrl } = createUrlBuilders(config);

  return {
    async list() {
      return await s3List(s3Client, bucket, prefix);
    },

    async read(fileName) {
      return await s3Read(s3Client, bucket, prefix, fileName);
    },

    async deleteFile(fileName) {
      return await s3Delete(s3Client, bucket, prefix, fileName);
    },

    async getFileMetadata(fileName) {
      return await s3GetMetadata(s3Client, bucket, prefix, fileName);
    },

    async fileExists(fileName) {
      return await s3FileExists(s3Client, bucket, prefix, fileName);
    },

    async getProperties(fileName) {
      return await s3GetProperties(s3Client, bucket, prefix, fileName);
    },

    async store(storageParams) {
      return await s3Store(s3Client, bucket, prefix, storageParams, downloadUrl);
    },
  };
}

// S3 Helper Functions

async function s3List(s3Client, bucket, prefix) {
  const response = await s3Client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
  );

  if (!response.Contents) return [];

  return response.Contents.map((file) => ({
    name: file.Key.replace(prefix, ''),
    size: file.Size,
    lastModified: file.LastModified,
    contentType: 'application/octet-stream',
    url: `https://${bucket}.s3.amazonaws.com/${file.Key}`,
  }));
}

async function s3Read(s3Client, bucket, prefix, fileName) {
  const key = `${prefix}${fileName}`;
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function s3Delete(s3Client, bucket, prefix, fileName) {
  const key = `${prefix}${fileName}`;
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return { success: true, fileName };
}

async function s3GetMetadata(s3Client, bucket, prefix, fileName) {
  const key = `${prefix}${fileName}`;
  const response = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    name: fileName,
    size: response.ContentLength,
    lastModified: response.LastModified,
    contentType: response.ContentType || 'application/octet-stream',
  };
}

async function s3FileExists(s3Client, bucket, prefix, fileName) {
  try {
    const key = `${prefix}${fileName}`;
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    return false;
  }
}

async function s3GetProperties(s3Client, bucket, prefix, fileName) {
  const key = `${prefix}${fileName}`;
  const response = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    size: response.ContentLength,
    lastModified: response.LastModified,
    contentType: response.ContentType || 'application/octet-stream',
  };
}

async function s3Store(s3Client, bucket, prefix, storageParams, downloadUrl) {
  const key = `${prefix}${storageParams.fileName}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: storageParams.content,
      ContentType: storageParams.mimeType,
    })
  );

  return {
    downloadUrl: downloadUrl(storageParams.fileName),
    storage: 's3',
    fileName: storageParams.fileName,
    properties: {
      size: storageParams.size,
      contentType: storageParams.mimeType,
      bucket,
      key,
    },
    management: {
      fileExisted: false,
      urlGenerated: true,
    },
  };
}

/**
 * Create S3 client with credentials
 */
async function createS3Client(config, params) {
  const { getAwsParameters } = require('../../shared/utils/parameters');
  const { accessKeyId, secretAccessKey, region } = getAwsParameters(params, config);

  return new S3Client({
    region: region || config.storage.s3.region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Create App Builder Files client
 */
async function createAppBuilderClient() {
  const { Files } = require('@adobe/aio-sdk');
  return await Files.init();
}

/**
 * Validate App Builder environment
 */
function validateAppBuilderEnvironment() {
  // Basic validation - could be expanded as needed
  if (!process.env.AIO_runtime_namespace) {
    console.warn('AIO_runtime_namespace not set - App Builder Files may not work properly');
  }
}

/**
 * Validate S3 environment
 */
function validateS3Environment(config, params) {
  if (!config.storage?.s3?.bucket) {
    throw new Error('S3 bucket not configured in config.storage.s3.bucket');
  }

  // Use parameter resolution to validate AWS credentials exist
  const { getAwsParameters } = require('../../shared/utils/parameters');
  getAwsParameters(params, config); // This will throw if credentials are missing
}

module.exports = {
  initializeStorageStrategy,
};
