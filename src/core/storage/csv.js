/**
 * Generic CSV generation utilities with memory optimization and streaming
 * @module core/storage/csv
 */

const csvWriter = require('csv-writer');
const { Transform } = require('stream');
const { compression } = require('../http');

/**
 * Configuration for CSV generation
 * @constant {Object}
 */
const CSV_CONFIG = {
    CHUNK_SIZE: 100,           // Number of records to process in each chunk
    COMPRESSION_LEVEL: 6,      // Default compression level (0-9)
    STREAM_HIGH_WATER_MARK: 16384 // Stream buffer size in bytes
};

/**
 * Creates a transform stream for converting objects to CSV rows
 * @param {function} rowMapper - Function to map an object to a CSV row
 * @returns {Transform} Transform stream
 */
function createRowTransformer(rowMapper) {
    return new Transform({
        objectMode: true,
        transform(record, encoding, callback) {
            try {
                const row = rowMapper(record);
                callback(null, row);
            } catch (error) {
                callback(error);
            }
        }
    });
}

/**
 * Creates a CSV stringifier with the specified headers
 * @param {Array<Object>} headers - Array of header definitions
 * @param {string} headers[].id - Column ID
 * @param {string} headers[].title - Column title
 * @returns {Object} CSV stringifier
 */
function createCsvStringifier(headers) {
    return csvWriter.createObjectCsvStringifier({
        header: headers.map(h => ({
            id: h.id || h,
            title: h.title || h.id || h
        }))
    });
}

/**
 * Generates a compressed CSV from an array of records
 * @param {Object} options - CSV generation options
 * @param {Array<Object>} options.records - Array of records to convert to CSV
 * @param {Array<Object>} options.headers - CSV header definitions
 * @param {function} options.rowMapper - Function to map a record to a CSV row
 * @param {Object|boolean} [options.compression] - Compression options or false to disable
 * @param {number} [options.chunkSize=100] - Number of records to process in each chunk
 * @returns {Promise<{content: Buffer, stats: Object}>} Compressed CSV content and stats
 * @throws {Error} If records array is empty or if CSV generation fails
 */
async function generateCsv({ records, headers, rowMapper, compression: compressionOptions, chunkSize = CSV_CONFIG.CHUNK_SIZE }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('No records provided for CSV generation');
    }

    if (!Array.isArray(headers) || headers.length === 0) {
        throw new Error('CSV headers must be provided');
    }

    if (typeof rowMapper !== 'function') {
        throw new Error('Row mapper function must be provided');
    }

    // Create CSV stringifier
    const stringifier = createCsvStringifier(headers);
    
    // Generate CSV content with streaming for memory efficiency
    const headerString = stringifier.getHeaderString();
    let csvContent = headerString;
    
    // Process records in chunks for memory efficiency
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        csvContent += stringifier.stringifyRecords(chunk.map(rowMapper));
    }

    // Compress the CSV content if compression is enabled
    const originalBuffer = Buffer.from(csvContent);
    if (compressionOptions === false) {
        return {
            content: originalBuffer,
            stats: {
                originalSize: originalBuffer.length,
                compressedSize: originalBuffer.length,
                savingsPercent: 0
            }
        };
    }

    const compressedContent = await compression.compress(originalBuffer, compressionOptions);
    const stats = compression.getCompressionStats(originalBuffer, compressedContent);

    return {
        content: compressedContent,
        stats
    };
}

/**
 * Creates a streaming CSV generator
 * @param {Object} options - Stream options
 * @param {Array<Object>} options.headers - CSV header definitions
 * @param {function} options.rowMapper - Function to map a record to a CSV row
 * @returns {Transform} Transform stream that converts objects to CSV rows
 */
function createCsvStream({ headers, rowMapper }) {
    if (!Array.isArray(headers) || headers.length === 0) {
        throw new Error('CSV headers must be provided');
    }

    if (typeof rowMapper !== 'function') {
        throw new Error('Row mapper function must be provided');
    }

    const stringifier = createCsvStringifier(headers);
    const transformer = createRowTransformer(rowMapper);

    // Add header to the stream
    transformer.push(stringifier.getHeaderString());

    // Transform records to CSV rows
    transformer._transform = (record, encoding, callback) => {
        try {
            const row = stringifier.stringifyRecords([rowMapper(record)]);
            callback(null, row);
        } catch (error) {
            callback(error);
        }
    };

    return transformer;
}

module.exports = {
    CSV_CONFIG,
    generateCsv,
    createCsvStream,
    createRowTransformer
}; 