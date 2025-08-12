/**
 * Adobe Commerce Inventory Module
 * Handles inventory data operations following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');
const { hasMorePages } = require('../utils');

/**
 * Build Commerce API search criteria URL parameters
 * @param {string} field - Search field name
 * @param {string} value - Search value
 * @param {string} condition - Search condition (default: 'eq')
 * @returns {string} URL search parameters
 */
function buildSearchCriteria(field, value, condition = 'eq') {
  return `searchCriteria[filter_groups][0][filters][0][field]=${field}&searchCriteria[filter_groups][0][filters][0][value]=${value}&searchCriteria[filter_groups][0][filters][0][condition_type]=${condition}`;
}

/**
 * Fetch inventory for a batch of products using batch API call with pagination
 * @param {Array} products - Product batch
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Array>} Inventory data
 */
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-inventory');

  // Extract all SKUs for batch query
  const skus = products.map(p => p.sku).join(',');
  
  // Use same pageSize as the batch size (typically 50)
  // Since we typically have 1 source per SKU, this should get all items in one call
  const pageSize = products.length;
  let currentPage = 1;
  let allSourceItems = [];
  let hasMore = true;
  
  while (hasMore) {
    const searchCriteria = 
      'searchCriteria[pageSize]=' + pageSize +
      '&searchCriteria[currentPage]=' + currentPage +
      '&searchCriteria[filter_groups][0][filters][0][field]=sku' +
      '&searchCriteria[filter_groups][0][filters][0][value]=' + skus +
      '&searchCriteria[filter_groups][0][filters][0][condition_type]=in';
    
    const url = `${baseUrl}/rest/${api.version}/inventory/source-items?${searchCriteria}`;
    
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      if (!response.ok) {
        log.warn('Inventory batch fetch failed', { 
          productCount: products.length, 
          status: response.status,
          page: currentPage,
        });
        // Return default inventory for all products on failure
        return products.map(product => ({
          product_id: product.id,
          sku: product.sku,
          qty: 0,
          is_in_stock: false,
        }));
      }

      const result = await response.json();
      allSourceItems = allSourceItems.concat(result.items || []);
      
      // Log pagination details for debugging
      log.info('Inventory batch response', {
        page: currentPage,
        itemsInPage: (result.items || []).length,
        totalCount: result.total_count,
        totalItemsSoFar: allSourceItems.length,
        requestedSKUs: products.length,
      });
      
      // Check for more pages using the same logic as products
      hasMore = hasMorePages(result, pageSize, currentPage);
      if (hasMore) {
        currentPage++;
      }
      
    } catch (error) {
      log.warn('Inventory batch fetch error', { 
        productCount: products.length, 
        error: error.message,
        page: currentPage,
      });
      // Return default inventory for all products on error
      return products.map(product => ({
        product_id: product.id,
        sku: product.sku,
        qty: 0,
        is_in_stock: false,
      }));
    }
  }
  
  // Create a map of SKU to inventory data for efficient lookup
  const inventoryMap = createInventoryMap(allSourceItems);
  
  // Log SKUs without inventory for debugging
  const skusWithoutInventory = products
    .filter(p => !inventoryMap[p.sku])
    .map(p => p.sku);
    
  if (skusWithoutInventory.length > 0) {
    log.warn('SKUs without inventory data', {
      count: skusWithoutInventory.length,
      total: products.length,
      missingSKUs: skusWithoutInventory.slice(0, 10), // Log first 10 for debugging
    });
  }
  
  // Map inventory data back to products
  return mapInventoryToProducts(products, inventoryMap);
}

/**
 * Create a map of SKU to aggregated inventory data
 * @param {Array} sourceItems - Array of source items from API response
 * @returns {Object} Map of SKU to inventory data
 */
function createInventoryMap(sourceItems) {
  const inventoryMap = {};
  
  for (const item of sourceItems) {
    const sku = item.sku;
    
    if (!inventoryMap[sku]) {
      inventoryMap[sku] = {
        qty: 0,
        is_in_stock: false,
      };
    }
    
    // Sum quantities from all source items for this SKU
    inventoryMap[sku].qty += parseFloat(item.quantity) || 0;
    
    // Mark as in stock if any source has status = 1 (enabled/in stock)
    if (item.status === 1) {
      inventoryMap[sku].is_in_stock = true;
    }
  }
  
  return inventoryMap;
}

/**
 * Map inventory data back to products
 * @param {Array} products - Array of products
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @returns {Array} Array of product inventory objects
 */
function mapInventoryToProducts(products, inventoryMap) {
  return products.map(product => {
    const inventory = inventoryMap[product.sku] || { qty: 0, is_in_stock: false };
    
    return {
      product_id: product.id,
      sku: product.sku,
      qty: inventory.qty,
      is_in_stock: inventory.is_in_stock,
    };
  });
}

/**
 * Create batched inventory fetch promises
 * @param {Array} products - Array of products
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Array} Array of inventory fetch promises
 */
function createInventoryBatches(products, config, bearerToken) {
  const { batching, baseUrl, api } = config.commerce;
  const inventoryPromises = [];
  for (let i = 0; i < products.length; i += batching.inventory) {
    const batch = products.slice(i, i + batching.inventory);
    inventoryPromises.push(fetchInventoryForProducts(batch, bearerToken, baseUrl, api));
  }
  return inventoryPromises;
}

module.exports = {
  fetchInventoryForProducts,
  createInventoryBatches,
  buildSearchCriteria,
  createInventoryMap,
  mapInventoryToProducts,
};
