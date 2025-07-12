/**
 * Scripts Core Parameters Utilities
 * Pure parameter filtering and processing functions
 */

/**
 * Filter action parameters for Adobe I/O Runtime
 * Removes system/reserved properties that shouldn't be sent to actions
 * @param {Object} params - Raw parameters object
 * @returns {Object} Filtered parameters safe for action execution
 */
function filterActionParameters(params) {
  return Object.keys(params)
    .filter((key) => {
      // Filter out Adobe I/O system variables
      if (key.startsWith('AIO_')) return false;

      // Filter out other reserved properties
      const reservedProperties = ['NODE_ENV', 'SERVICE_API_KEY'];
      if (reservedProperties.includes(key)) return false;

      return true;
    })
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});
}

/**
 * Extract specific parameters from object
 * @param {Object} params - Source parameters object
 * @param {string[]} keys - Keys to extract
 * @returns {Object} Object with only specified keys
 */
function extractParameters(params, keys) {
  return keys.reduce((obj, key) => {
    if (params[key] !== undefined) {
      obj[key] = params[key];
    }
    return obj;
  }, {});
}

module.exports = {
  filterActionParameters,
  extractParameters,
};
