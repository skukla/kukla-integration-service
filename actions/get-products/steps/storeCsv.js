const { getStorageConfig } = require('../storageConfig');
const { storeFile } = require('../storage');

module.exports = async function storeCsv(filePath, fileName) {
  const config = getStorageConfig();
  return await storeFile(filePath, fileName, config);
}; 