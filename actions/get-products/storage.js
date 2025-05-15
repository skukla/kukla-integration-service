const FilesLib = require('@adobe/aio-lib-files');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function storeFile(content, fileName, config) {
  const { storageType, s3Config } = config;

  if (storageType === 'filestore') {
    const files = await FilesLib.init();
    // FilesLib.write will overwrite by default
    await files.write(fileName, content, { contentType: 'text/csv' });
    return { location: 'filestore', fileName };
  } else if (storageType === 's3') {
    const s3 = new S3Client({ region: s3Config.region });
    // S3 PutObject will overwrite by default
    await s3.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fileName,
      Body: content,
      ContentType: 'text/csv'
    }));
    return { location: 's3', fileName };
  } else {
    throw new Error('Unsupported storage type');
  }
}

module.exports = { storeFile }; 