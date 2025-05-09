const FilesLib = require('@adobe/aio-lib-files');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

async function storeFile(filePath, fileName, config) {
  const { storageType, s3Config } = config;
  const fileContent = fs.readFileSync(filePath);
  if (storageType === 'filestore') {
    const files = await FilesLib.init();
    await files.write(fileName, fileContent, { contentType: 'text/csv' });
    return { location: 'filestore', fileName };
  } else if (storageType === 's3') {
    const s3 = new S3Client({ region: s3Config.region });
    await s3.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fileName,
      Body: fileContent,
      ContentType: 'text/csv'
    }));
    return { location: 's3', fileName };
  } else {
    throw new Error('Unsupported storage type');
  }
}

module.exports = { storeFile }; 