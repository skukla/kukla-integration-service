const path = require('path');
const { generateCsv } = require('../csvGenerator');

const FIXED_FILENAME = 'products.csv';

module.exports = async function createCsv(productsWithCategories) {
  const csvContent = await generateCsv(productsWithCategories);
  return { fileName: FIXED_FILENAME, content: csvContent };
}; 