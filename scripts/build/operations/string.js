/**
 * String Operations for Build Domain
 * Moved from core - only used in build domain
 */

/**
 * Capitalize the first letter of a string
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
