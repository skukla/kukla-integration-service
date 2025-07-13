/**
 * Scripts Core URL Utilities
 * Pure URL manipulation functions with no I/O side effects
 */

/**
 * Replace domain in URL
 * @param {string} url - Original URL
 * @param {string} newDomain - New domain (with protocol)
 * @returns {string} URL with replaced domain
 */
function replaceDomain(url, newDomain) {
  if (!url || !newDomain) {
    return url;
  }

  return url.replace(/https?:\/\/[^/]+/, newDomain);
}

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain including protocol
 */
function extractDomain(url) {
  if (!url) {
    return '';
  }

  const match = url.match(/https?:\/\/[^/]+/);
  return match ? match[0] : '';
}

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  replaceDomain,
  extractDomain,
  isValidUrl,
};
