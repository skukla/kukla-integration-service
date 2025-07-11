/**
 * Scripts Core String Utilities
 * Shared string manipulation functions used by all script domains
 */

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  capitalize,
};
