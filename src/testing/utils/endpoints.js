/**
 * Testing Endpoints Utility
 * Available API endpoints for testing
 */

/**
 * Get available API endpoints for testing
 * @returns {Array<string>} Available endpoints
 */
function getAvailableEndpoints() {
  return ['products', 'products-mesh', 'files'];
}

module.exports = {
  getAvailableEndpoints,
};
