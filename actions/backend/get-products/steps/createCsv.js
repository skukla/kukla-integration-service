/**
 * CSV generation step for product export
 * @module steps/createCsv
 */

const { 
    storage: { csv },
    http: { compression: { COMPRESSION_LEVELS } }
} = require('../../../../src/core');
const { transform: { product: { mapProductToCsvRow } } } = require('../../../../src/commerce');

/**
 * CSV header definitions for product export
 * @constant {Array<Object>}
 */
const CSV_HEADERS = [
    { id: 'sku', title: 'entity.id' },
    { id: 'name', title: 'entity.name' },
    { id: 'categories', title: 'entity.category' },
    { id: 'price', title: 'entity.value' },
    { id: 'qty', title: 'entity.inventory' },
    { id: 'base_image', title: 'entity.base_image' }
];

/**
 * Generates a compressed CSV file from product data
 * @param {Array<Object>} products - Array of transformed product objects
 * @returns {Promise<{content: Buffer, stats: Object}>} Generated CSV content and compression stats
 */
async function createCsv(products) {
    return csv.generateCsv({
        records: products,
        headers: CSV_HEADERS,
        rowMapper: mapProductToCsvRow,
        compression: {
            level: COMPRESSION_LEVELS.HIGH
        }
    });
}

module.exports = createCsv;