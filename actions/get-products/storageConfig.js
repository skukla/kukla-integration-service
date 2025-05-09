function getStorageConfig() {
  const storageType = process.env.STORAGE_TYPE || 'filestore';
  const s3Config = {
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET
  };
  return { storageType, s3Config };
}

module.exports = { getStorageConfig }; 