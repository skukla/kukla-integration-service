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

/**
 * Convert camelCase to kebab-case
 * @param {string} str - camelCase string
 * @returns {string} kebab-case string
 */
function camelToKebab(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
function kebabToCamel(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength) {
  if (!str || typeof str !== 'string' || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

module.exports = {
  capitalize,
  camelToKebab,
  kebabToCamel,
  truncate,
};
