/**
 * Test Domain - Parameter Handling Operations
 * Operations for filtering and processing action parameters
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

module.exports = {
  filterActionParameters,
};
