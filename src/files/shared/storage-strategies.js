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
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { getAwsParameters } = require('../../shared/utils/cache');

// Storage provider maximum expiry limits
const STORAGE_EXPIRY_LIMITS = {
  APP_BUILDER: 86400, // 24 hours - App Builder Files maximum
  S3: 604800, // 7 days - AWS S3 maximum
};

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
      return await createAppBuilderStorage(config, params);
    case 's3':
      return await createS3Storage(config, params);
    default:
      throw new Error(`Unknown storage provider: ${provider}. Available: app-builder, s3`);
  }
}

/**
 * Create App Builder storage interface
 */
async function createAppBuilderStorage(config, params) {
  validateAppBuilderEnvironment();
  const files = await createAppBuilderClient(params);

  return {
    async list() {
      return await appBuilderList(files);
    },

    async read(fileName) {
      const fullFileName = `${config.storage.directory}${fileName}`;
      return await files.read(fullFileName);
    },

    async deleteFile(fileName) {
      await files.delete(fileName);
      return { success: true, fileName };
    },

    async getFileMetadata(fileName) {
      return await appBuilderGetMetadata(files, fileName, config);
    },

    async fileExists(fileName) {
      return await appBuilderFileExists(files, fileName, config);
    },

    async getProperties(fileName) {
      const fullFileName = `${config.storage.directory}${fileName}`;
      return await files.getProperties(fullFileName);
    },

    async store(storageParams) {
      return await appBuilderStore(files, config, storageParams);
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

async function appBuilderGetMetadata(files, fileName, config) {
  const fullFileName = `${config.storage.directory}${fileName}`;
  const properties = await files.getProperties(fullFileName);
  return {
    name: fileName,
    size: properties.size,
    lastModified: properties.lastModified,
    contentType: properties.contentType,
  };
}

async function appBuilderFileExists(files, fileName, config) {
  try {
    const fullFileName = `${config.storage.directory}${fileName}`;
    await files.getProperties(fullFileName);
    return true;
  } catch (error) {
    return false;
  }
}

async function appBuilderStore(files, config, storageParams) {
  const fullFileName = `${config.storage.directory}${storageParams.fileName}`;
  await files.write(fullFileName, storageParams.content);

  // Generate presigned URL for downloads using maximum available expiry
  const expirySeconds = STORAGE_EXPIRY_LIMITS.APP_BUILDER;
  const presignedUrl = await files.generatePresignURL(fullFileName, {
    expiryInSeconds: expirySeconds,
    permissions: 'r', // read-only for downloads
  });

  return {
    downloadUrl: presignedUrl,
    storage: 'app-builder',
    fileName: storageParams.fileName,
    expirySeconds: STORAGE_EXPIRY_LIMITS.APP_BUILDER,
    properties: {
      path: fullFileName,
      mimeType: storageParams.mimeType,
      size: storageParams.size,
    },
    management: {
      createdAt: new Date().toISOString(),
      provider: 'Adobe I/O Files',
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
      return await s3Store(s3Client, bucket, prefix, config, storageParams);
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

async function s3Store(s3Client, bucket, prefix, config, storageParams) {
  const key = `${prefix}${storageParams.fileName}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: storageParams.content,
      ContentType: storageParams.mimeType,
    })
  );

  // Generate presigned URL for downloads using maximum available expiry
  const expirySeconds = STORAGE_EXPIRY_LIMITS.S3;
  const presignedUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: expirySeconds }
  );

  return {
    downloadUrl: presignedUrl,
    storage: 's3',
    fileName: storageParams.fileName,
    expirySeconds: STORAGE_EXPIRY_LIMITS.S3,
    properties: {
      bucket: bucket,
      key: key,
      mimeType: storageParams.mimeType,
      size: storageParams.size,
    },
    management: {
      createdAt: new Date().toISOString(),
      provider: 'AWS S3',
    },
  };
}

/**
 * Create S3 client with credentials
 */
async function createS3Client(config, params) {
  const { accessKeyId, secretAccessKey, region } = getAwsParameters(params, config);

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Create App Builder Files client
 */
async function createAppBuilderClient(params) {
  const { Files } = require('@adobe/aio-sdk');
  return await Files.init(params);
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
  getAwsParameters(params, config); // This will throw if credentials are missing
}

module.exports = {
  initializeStorageStrategy,
  STORAGE_EXPIRY_LIMITS,
};
