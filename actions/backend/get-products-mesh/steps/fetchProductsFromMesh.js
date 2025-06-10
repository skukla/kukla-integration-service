/**
 * Fetch products from API Mesh step
 * @module steps/fetchProductsFromMesh
 */

const { fetchProductsWithExistingUtils, fetchProductsDirectAPI } = require('../lib/mesh-adapter');

/**
 * Fetch products using Action-Localized Bridge (Option 2)
 * @param {Object} params - Action parameters with credentials
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of enhanced product objects
 */
async function fetchProductsFromMesh(params, config) {
  try {
    // Option A: Reuse existing Commerce utilities (RECOMMENDED)
    // This provides 100% code reuse and maintains parity with get-products
    const useExistingUtils = config.commerce?.useExistingUtils !== false;

    if (useExistingUtils) {
      // Use the EXACT same logic as get-products action
      return await fetchProductsWithExistingUtils(params);
    } else {
      // Fallback: Direct API calls (if existing utils need adaptation)
      return await fetchProductsDirectAPI(params, config);
    }
  } catch (error) {
    throw new Error(`Product fetch failed: ${error.message}`);
  }
}

module.exports = fetchProductsFromMesh;
