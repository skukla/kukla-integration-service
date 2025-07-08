/**
 * Transformation operations for utilities
 * @module core/utils/operations/transformation
 */

/**
 * Transform an object based on field mappings and requested fields
 * @param {Object} input - Input object to transform
 * @param {Object} fieldMappings - Map of field names to transformation functions
 * @param {Array<string>} requestedFields - Array of field names to include
 * @returns {Object} Transformed object with only requested fields
 */
function transformObject(input, fieldMappings, requestedFields) {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const result = {};

  // If no requested fields specified, include all available mappings
  const fields =
    Array.isArray(requestedFields) && requestedFields.length > 0
      ? requestedFields
      : Object.keys(fieldMappings);

  fields.forEach((field) => {
    if (fieldMappings[field] && typeof fieldMappings[field] === 'function') {
      try {
        result[field] = fieldMappings[field]();
      } catch (error) {
        // If transformation fails, set to null and log warning
        console.warn(`Failed to transform field '${field}':`, error.message);
        result[field] = null;
      }
    } else if (input[field] !== undefined) {
      // If no mapping function, use the original value
      result[field] = input[field];
    }
  });

  return result;
}

module.exports = {
  transformObject,
};
