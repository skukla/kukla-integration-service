/**
 * Compression utilities for API responses
 * @module lib/api/compression
 */
const zlib = require('zlib');
const { promisify } = require('util');

// Promisify zlib methods
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Compression options optimized for JSON/CSV data
 * @private
 * @constant
 */
const COMPRESSION_OPTIONS = {
  level: 6, // Balanced between speed and compression
  memLevel: 8, // Slightly reduced from default 9 to save memory
  strategy: zlib.constants.Z_DEFAULT_STRATEGY
};

/**
 * Compresses data using gzip
 * @param {string|Buffer} data - Data to compress
 * @param {Object} [options] - Compression options
 * @returns {Promise<Buffer>} Compressed data
 */
async function compress(data, options = {}) {
  const compressionOptions = {
    ...COMPRESSION_OPTIONS,
    ...options
  };
  
  return gzip(data, compressionOptions);
}

/**
 * Decompresses gzipped data
 * @param {Buffer} data - Compressed data
 * @returns {Promise<Buffer>} Decompressed data
 */
async function decompress(data) {
  return gunzip(data);
}

/**
 * Estimates the memory savings from compression
 * @param {Buffer} original - Original data
 * @param {Buffer} compressed - Compressed data
 * @returns {Object} Memory savings statistics
 */
function getCompressionStats(original, compressed) {
  const originalSize = original.length;
  const compressedSize = compressed.length;
  const savedBytes = originalSize - compressedSize;
  const savingsPercent = ((savedBytes / originalSize) * 100).toFixed(1);
  
  return {
    originalSize,
    compressedSize,
    savedBytes,
    savingsPercent: `${savingsPercent}%`
  };
}

module.exports = {
  compress,
  decompress,
  getCompressionStats
}; 