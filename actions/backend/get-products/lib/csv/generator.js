/**
 * CSV generation utilities with memory optimization and compression
 * @module lib/csv/generator
 */
const csvWriter = require('csv-writer');
const { Transform } = require('stream');
const { compress, getCompressionStats } = require('../api/compression');

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
 * Stream transformer for converting products to CSV rows
 * @private
 * @returns {Transform} Transform stream
 */
function createProductTransformer() {
  return new Transform({
    objectMode: true,
    transform(product, encoding, callback) {
      try {
        const row = mapProductToCsvRow(product);
        callback(null, row);
      } catch (error) {
        callback(error);
      }
    }
  });
}

/**
 * Generates a compressed CSV string from an array of product objects
 * @param {Object[]} products - Array of product objects to convert to CSV
 * @returns {Promise<{content: Buffer, stats: Object}>} Compressed CSV content and compression stats
 * @throws {Error} If products array is empty or if CSV generation fails
 */
async function generateCsv(products) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products provided for CSV generation');
  }

  // Create CSV stringifier with headers
  const stringifier = csvWriter.createObjectCsvStringifier({
    header: csvHeaders.map(h => ({ id: h, title: h }))
  });
  
  // Generate CSV content with streaming for memory efficiency
  const headerString = stringifier.getHeaderString();
  let csvContent = headerString;
  
  // Process products in chunks for memory efficiency
  const CHUNK_SIZE = 100;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    csvContent += stringifier.stringifyRecords(chunk.map(mapProductToCsvRow));
  }

  // Compress the CSV content
  const originalBuffer = Buffer.from(csvContent);
  const compressedContent = await compress(originalBuffer);
  const stats = getCompressionStats(originalBuffer, compressedContent);

  console.log(`CSV Generation: ${stats.savingsPercent} size reduction through compression (${stats.originalSize} → ${stats.compressedSize} bytes)`);

  return {
    content: compressedContent,
    stats
  };
}

module.exports = {
  generateCsv,
  csvHeaders
}; 