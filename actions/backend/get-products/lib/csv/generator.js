/**
 * CSV Generation module for product data export
 * @module csv/generator
 * @description Handles the conversion of product data into CSV format with consistent headers and data mapping
 */

const csvWriter = require('csv-writer');

/**
 * Formats product categories into a comma-separated string
 * @private
 * @param {string[]|string} categories - Array of categories or single category string
 * @returns {string} Formatted category string
 * @example
 * formatCategories(['Electronics', 'Phones']) // Returns: 'Electronics, Phones'
 * formatCategories('Electronics') // Returns: 'Electronics'
 * formatCategories(null) // Returns: ''
 */
function formatCategories(categories) {
  if (Array.isArray(categories)) {
    return categories.join(', ');
  }
  return categories || '';
}

/**
 * Gets the primary image URL from a product's images array
 * @private
 * @param {Object[]} [images] - Array of product image objects
 * @returns {string} Primary image URL or empty string if none exists
 */
function getPrimaryImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }
  // Handle both URL and filename formats
  return images[0].url || images[0].filename || '';
}

/**
 * CSV header definitions for product export
 * @constant {string[]}
 * @description Defines the structure of the CSV file with entity-prefixed columns
 */
const csvHeaders = [
  'entity.id',        // Product SKU
  'entity.name',      // Product name
  'entity.category',  // Comma-separated categories
  'entity.value',     // Product price
  'entity.inventory', // Current stock quantity
  'entity.base_image' // Primary product image URL
];

/**
 * Maps a product object to a CSV row format
 * @private
 * @param {Object} product - Product data object
 * @param {string} product.sku - Product SKU
 * @param {string} product.name - Product name
 * @param {Array|string} product.categories - Product categories
 * @param {number} product.price - Product price
 * @param {number} product.qty - Product quantity
 * @param {Array} [product.images] - Product images array
 * @returns {Object} CSV row object with entity prefixed keys
 * @throws {Error} If required product properties are missing
 */
function mapProductToCsvRow(product) {
  return {
    'entity.id': product.sku,
    'entity.name': product.name,
    'entity.category': formatCategories(product.categories),
    'entity.value': product.price,
    'entity.inventory': product.qty,
    'entity.base_image': getPrimaryImageUrl(product.images)
  };
}

/**
 * Generates a CSV string from an array of product objects
 * @param {Object[]} products - Array of product objects to convert to CSV
 * @returns {Promise<string>} CSV content as a string
 * @throws {Error} If products array is empty or if CSV generation fails
 * @example
 * const products = [{
 *   sku: 'ABC123',
 *   name: 'Sample Product',
 *   categories: ['Electronics'],
 *   price: 99.99,
 *   qty: 100,
 *   images: [{url: 'http://example.com/image.jpg'}]
 * }];
 * const csv = await generateCsv(products);
 */
async function generateCsv(products) {
  const csvStringifier = csvWriter.createObjectCsvStringifier({
    header: csvHeaders.map(h => ({ id: h, title: h }))
  });
  
  const rows = products.map(mapProductToCsvRow);
  const headerString = csvStringifier.getHeaderString();
  const rowString = csvStringifier.stringifyRecords(rows);
  
  return headerString + rowString;
}

module.exports = { generateCsv }; 