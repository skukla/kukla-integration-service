/**
 * Constant for the output CSV filename.
 * @constant {string}
 */
const FIXED_FILENAME = 'products.csv';

/**
 * Generates a CSV file from the enriched product data.
 * 
 * @param {Object[]} productsWithCategories - Array of product objects with category information
 * @param {string} productsWithCategories[].sku - Product SKU
 * @param {string} productsWithCategories[].name - Product name
 * @param {number} productsWithCategories[].price - Product price
 * @param {number} productsWithCategories[].qty - Product quantity
 * @param {string[]} productsWithCategories[].categories - Array of category names
 * @param {Object[]} productsWithCategories[].images - Array of product images
 * @returns {Promise<Object>} Object containing the filename and CSV content
 * @property {string} fileName - The name of the generated CSV file
 * @property {string} content - The CSV content as a string
 */
const { generateCsv } = require('../lib/csv/generator');

module.exports = async function createCsv(productsWithCategories) {
  const csvContent = await generateCsv(productsWithCategories);
  
  return { 
    fileName: FIXED_FILENAME, 
    content: csvContent 
  };
};