/**
 * Inventory Enrichment Operations
 *
 * Mid-level business logic for enriching products with inventory data.
 * Contains operations for fetching inventory data and enriching products with stock information.
 */

const { executeCommerceRequest } = require('../../commerce');
const { extractProductSkus } = require('../utils/category');

/**
 * Fetch inventory data from Commerce API in batches
 * API function that fetches inventory data for given SKUs.
 *
 * @param {Array} skus - Array of SKUs to fetch inventory for
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Map of SKU to inventory data
 */
async function fetchInventoryData(skus, config, params, trace = null) {
  const inventoryMap = {};

  const batchSize = config.mesh.batching.inventory;
  const requestDelay = config.mesh.batching.requestDelay;
  const maxConcurrent = config.mesh.batching.maxConcurrent;

  // Process in batches with configurable concurrency
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const inventoryPromises = chunk.map(async (sku) => {
        try {
          const response = await executeCommerceRequest(
            `/stockItems/${sku}`,
            { method: 'GET' },
            config,
            params,
            trace
          );

          if (response.body) {
            inventoryMap[sku] = {
              qty: response.body.qty || 0,
              is_in_stock: response.body.is_in_stock || false,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch inventory for ${sku}: ${error.message}`);
          inventoryMap[sku] = { qty: 0, is_in_stock: false };
        }
      });

      await Promise.all(inventoryPromises);

      // Add configurable delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return inventoryMap;
}

/**
 * Enrich products with inventory data
 * Pure function that adds inventory information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @returns {Array} Array of products enriched with inventory
 */
function enrichProductsWithInventory(products, inventoryMap) {
  return products.map((product) => ({
    ...product,
    qty: inventoryMap[product.sku]?.qty || 0,
    is_in_stock: inventoryMap[product.sku]?.is_in_stock || false,
  }));
}

/**
 * Enrich products with inventory data
 * Composition function that combines SKU extraction, fetching, and enrichment.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with inventory
 */
async function enrichWithInventory(products, config, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  try {
    // Step 1: Extract SKUs for inventory lookup
    const skus = extractProductSkus(products);
    if (skus.length === 0) {
      return products;
    }

    // Step 2: Fetch inventory data from Commerce API
    const inventoryMap = await fetchInventoryData(skus, config, params, trace);

    // Step 3: Enrich products with inventory data
    return enrichProductsWithInventory(products, inventoryMap);
  } catch (error) {
    console.warn(`Inventory enrichment failed: ${error.message}`);
    return products; // Return products without inventory enrichment
  }
}

module.exports = {
  fetchInventoryData,
  enrichProductsWithInventory,
  enrichWithInventory,
};
