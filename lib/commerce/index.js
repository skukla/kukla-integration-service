/**
 * Adobe Commerce Integration Module
 * Main entry point that orchestrates all commerce operations
 */

const { getCommerceToken } = require('./auth');
const { enrichProducts } = require('./enrichment');
const { getProductsFromMesh } = require('./mesh-client');
const { fetchProducts } = require('./products');

/**
 * Fetch and enrich products from Adobe Commerce with optional caching
 * Uses admin token authentication and enriches with categories/inventory
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {Object} cache - Cache instance (optional)
 * @param {Object} logger - Logger instance (optional)
 * @returns {Promise<Array>} Array of enriched products
 */
async function fetchAndEnrichProducts(params, config, cache = null, logger = null) {
  let retryCount = 0;
  const maxRetries = 1; // Only retry once for token expiration

  while (retryCount <= maxRetries) {
    try {
      let apiCallCount = 0;
      let totalCacheHits = 0;

      // Get admin token
      const tokenResult = await getCommerceToken(params, config, cache, logger);
      const bearerToken = tokenResult.token;
      let adminTokenApiCalls = 0;
      if (tokenResult.cacheHit) {
        totalCacheHits += 1;
        if (logger) {
          logger.info('Admin token cache hit counted');
        }
      } else {
        apiCallCount += 1;
        adminTokenApiCalls = 1;
      }

      // Fetch products
      const productsResult = await fetchProducts(
        params.COMMERCE_ADMIN_USERNAME,
        config,
        bearerToken,
        cache,
        logger
      );
      apiCallCount += productsResult.apiCallCount;
      totalCacheHits += productsResult.cacheHits || 0;

      // Enrich with categories and inventory
      const enrichmentResult = await enrichProducts(
        productsResult.products,
        config,
        bearerToken,
        cache,
        logger
      );
      apiCallCount += enrichmentResult.apiCalls;
      totalCacheHits += enrichmentResult.cacheHits || 0;

      if (logger && totalCacheHits > 0) {
        logger.info(`Total Commerce API cache hits: ${totalCacheHits}`);
      }

      return {
        products: enrichmentResult.products,
        apiCalls: {
          total: apiCallCount,
          adminToken: adminTokenApiCalls,
          products: productsResult.apiCallCount,
          categories: enrichmentResult.categoriesApiCalls,
          inventory: enrichmentResult.inventoryApiCalls,
          totalProductPages: productsResult.totalPages,
        },
        cacheHits: totalCacheHits,
      };
    } catch (error) {
      if (error.message === 'ADMIN_TOKEN_EXPIRED' && retryCount < maxRetries) {
        retryCount++;
        if (logger) {
          logger.info(`Retrying with fresh admin token (attempt ${retryCount}/${maxRetries})`);
        }
        continue; // Retry with fresh token
      }
      throw new Error(`Commerce API integration failed: ${error.message}`);
    }
  }
}

module.exports = {
  fetchAndEnrichProducts,
  getCommerceToken,
  getProductsFromMesh,
};
