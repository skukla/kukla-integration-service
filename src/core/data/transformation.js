/**
 * Core data transformation utilities
 * @module core/data/transformation
 */

/**
 * Formats a file size into a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
    const BYTES_PER_UNIT = 1024;
    const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) return '0 B';
    
    const exponent = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT));
    const value = parseFloat((bytes / Math.pow(BYTES_PER_UNIT, exponent)).toFixed(2));
    const unit = SIZE_UNITS[exponent];
    
    return `${value} ${unit}`;
}

/**
 * Formats a date for consistent display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return new Date(date).toLocaleString();
}

/**
 * Formats an array into a comma-separated string
 * @param {Array|string} items - Array of items or single item
 * @param {string} [separator=', '] - Separator to use between items
 * @returns {string} Formatted string
 */
function formatList(items, separator = ', ') {
    if (Array.isArray(items)) {
        return items.join(separator);
    }
    return items || '';
}

/**
 * Formats a metric value based on its type
 * @param {string} metric - Type of metric (e.g., 'executionTime', 'memory', 'compression')
 * @param {number} value - Value to format
 * @returns {string} Formatted metric value
 */
function formatMetricValue(metric, value) {
    switch (metric) {
        case 'executionTime':
            return `${(value / 1000).toFixed(2)}s`;
        case 'memory':
            return `${(value / 1024 / 1024).toFixed(1)}MB`;
        case 'compression':
            return `${value}%`;
        default:
            return value.toString();
    }
}

/**
 * Transforms an object by mapping specified fields
 * @param {Object} input - Input object to transform
 * @param {Object<string, function>} fieldMappings - Map of field names to transform functions
 * @param {Array<string>} [requestedFields] - Optional array of fields to include
 * @returns {Object} Transformed object
 */
function transformObject(input, fieldMappings, requestedFields) {
    const fields = requestedFields || Object.keys(fieldMappings);
    return fields.reduce((obj, field) => {
        if (fieldMappings[field]) {
            obj[field] = fieldMappings[field](input);
        }
        return obj;
    }, {});
}

/**
 * Transforms a stream of objects using the provided transform function
 * @param {Transform} stream - Transform stream
 * @param {function} transformFn - Function to transform each object
 * @returns {Transform} Transform stream
 */
function createObjectTransformer(transformFn) {
    const { Transform } = require('stream');
    return new Transform({
        objectMode: true,
        transform(object, encoding, callback) {
            try {
                const transformed = transformFn(object);
                callback(null, transformed);
            } catch (error) {
                callback(error);
            }
        }
    });
}

module.exports = {
    formatFileSize,
    formatDate,
    formatList,
    formatMetricValue,
    transformObject,
    createObjectTransformer
}; 