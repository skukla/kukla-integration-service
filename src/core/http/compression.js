/**
 * HTTP compression utilities
 * @module core/http/compression
 */

const { promisify } = require('util');
const zlib = require('zlib');

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

/**
 * Compression configuration
 * @enum {Object}
 */
const CompressionConfig = {
  // Minimum size in bytes before applying compression
  MIN_SIZE: 1024, // 1KB

  // Content types that should be compressed
  COMPRESSIBLE_TYPES: [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'text/plain',
    'text/xml',
    'application/xml',
  ],

  // Compression methods in order of preference
  METHODS: {
    GZIP: 'gzip',
    DEFLATE: 'deflate',
  },
};

/**
 * Checks if content should be compressed based on size and type
 * @param {string|Buffer|Object|number} content - Content to check
 * @param {string} contentType - Content type
 * @returns {boolean} Whether content should be compressed
 */
function shouldCompress(content, contentType) {
  // Convert objects and numbers to strings for compression check
  let contentToCheck;
  if (typeof content === 'number') {
    contentToCheck = content.toString();
  } else if (typeof content === 'object') {
    contentToCheck = JSON.stringify(content);
  } else {
    contentToCheck = content;
  }

  const size = Buffer.byteLength(contentToCheck);
  const type = contentType.split(';')[0].toLowerCase();

  return size >= CompressionConfig.MIN_SIZE && CompressionConfig.COMPRESSIBLE_TYPES.includes(type);
}

/**
 * Determines best compression method based on Accept-Encoding header
 * @param {string} acceptEncoding - Accept-Encoding header value
 * @returns {string|null} Compression method to use, or null if none
 */
function getCompressionMethod(acceptEncoding = '') {
  const accepted = acceptEncoding
    .toLowerCase()
    .split(',')
    .map((e) => e.trim());

  if (accepted.includes(CompressionConfig.METHODS.GZIP)) {
    return CompressionConfig.METHODS.GZIP;
  }
  if (accepted.includes(CompressionConfig.METHODS.DEFLATE)) {
    return CompressionConfig.METHODS.DEFLATE;
  }

  return null;
}

/**
 * Compresses content using specified method
 * @param {string|Buffer|Object|number} content - Content to compress
 * @param {string} method - Compression method
 * @returns {Promise<Buffer>} Compressed content
 */
async function compressContent(content, method) {
  // Convert objects and numbers to strings before compression
  let contentToCompress;
  if (typeof content === 'number') {
    contentToCompress = content.toString();
  } else if (typeof content === 'object') {
    contentToCompress = JSON.stringify(content);
  } else {
    contentToCompress = content;
  }

  const buffer = Buffer.isBuffer(contentToCompress)
    ? contentToCompress
    : Buffer.from(contentToCompress);

  switch (method) {
    case CompressionConfig.METHODS.GZIP:
      return gzip(buffer);
    case CompressionConfig.METHODS.DEFLATE:
      return deflate(buffer);
    default:
      throw new Error(`Unsupported compression method: ${method}`);
  }
}

/**
 * Adds compression to a response if appropriate
 * @param {Object} response - Response object
 * @param {Object} options - Compression options
 * @param {string} [options.acceptEncoding] - Accept-Encoding header
 * @returns {Promise<Object>} Response with compression if applied
 */
async function addCompression(response, options = {}) {
  const contentType = response.headers?.['Content-Type'] || 'text/plain';
  const content = response.body;

  // Check if compression should be applied
  if (!shouldCompress(content, contentType)) {
    return response;
  }

  // Determine compression method
  const method = getCompressionMethod(options.acceptEncoding);
  if (!method) {
    return response;
  }

  try {
    // Compress content
    const compressed = await compressContent(content, method);

    // Return compressed response
    return {
      ...response,
      body: compressed,
      headers: {
        ...response.headers,
        'Content-Encoding': method,
        'Content-Length': compressed.length,
        Vary: 'Accept-Encoding',
      },
    };
  } catch (error) {
    // If compression fails, return original response
    return response;
  }
}

module.exports = {
  CompressionConfig,
  shouldCompress,
  getCompressionMethod,
  addCompression,
};
