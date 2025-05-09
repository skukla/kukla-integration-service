const path = require('path');
const { generateCsv } = require('../csvGenerator');

module.exports = async function createCsv(productsWithCategories) {
  const fileName = `products-${Date.now()}.csv`;
  const filePath = path.join('/tmp', fileName);
  await generateCsv(productsWithCategories, filePath);
  return { fileName, filePath };
}; 