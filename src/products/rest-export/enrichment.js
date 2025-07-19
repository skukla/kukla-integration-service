/**
 * REST Export - Product Enrichment Sub-module
 * All product enrichment utilities for REST API export
 */

const { executeBatchAuthenticatedRequests } = require('../../commerce/admin-token-auth');
const { extractProductSkus } = require('../shared/data-extraction');

// Enrichment Workflows

/**
 * Enrich products with category data
 * @purpose Add category information to products using category IDs
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Array>} Products enriched with category data
 * @usedBy fetchAndEnrichProducts in rest-export.js
 */
async function enrichWithCategories(products, config, params) {
  try {
    // Step 1: Extract unique category IDs from products
    const categoryIds = extractCategoryIds(products);

    if (categoryIds.length === 0) {
      return products;
    }

    // Step 2: Fetch category data for all unique IDs
    const categoryMap = await fetchCategoryData(categoryIds, config, params);

    // Step 3: Enrich products with category information
    return enrichProductsWithCategories(products, categoryMap);
  } catch (error) {
    console.warn('Category enrichment failed, continuing without categories:', error.message);
    return products;
  }
}

/**
 * Enrich products with inventory data
 * @purpose Add inventory/stock information to products using product SKUs
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Array>} Products enriched with inventory data
 * @usedBy fetchAndEnrichProducts in rest-export.js
 */
async function enrichWithInventory(products, config, params) {
  try {
    // Step 1: Extract unique SKUs from products
    const skus = extractProductSkus(products);

    if (skus.length === 0) {
      return products;
    }

    // Step 2: Fetch inventory data for all unique SKUs
    const inventoryMap = await fetchInventoryData(skus, config, params);

    // Step 3: Enrich products with inventory information
    return enrichProductsWithInventory(products, inventoryMap);
  } catch (error) {
    console.warn('Inventory enrichment failed, continuing without inventory:', error.message);
    return products;
  }
}

// Enrichment Utilities

/**
 * Extract unique category IDs from products
 * @purpose Get all unique category IDs referenced by products for bulk fetching
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of unique category IDs
 * @usedBy enrichWithCategories
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  products.forEach((product) => {
    if (product.extension_attributes && product.extension_attributes.category_links) {
      product.extension_attributes.category_links.forEach((link) => {
        if (link.category_id) {
          categoryIds.add(link.category_id);
        }
      });
    }
  });

  return Array.from(categoryIds);
}

/**
 * Fetch category data from Commerce API
 * @purpose Retrieve category information for given category IDs
 * @param {Array} categoryIds - Array of category IDs to fetch
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Object>} Map of category ID to category data
 * @usedBy enrichWithCategories
 */
async function fetchCategoryData(categoryIds, config, params) {
  const categoryRequests = categoryIds.map((categoryId) => ({
    endpoint: `${config.commerce.paths.categories}/${categoryId}`,
    method: 'GET',
  }));

  const batchResponse = await executeBatchAuthenticatedRequests(categoryRequests, config, params);

  const categoryMap = {};
  batchResponse.forEach((response, index) => {
    if (response.success && response.data) {
      categoryMap[categoryIds[index]] = response.data;
    }
  });

  return categoryMap;
}

/**
 * Enrich products with category information
 * @purpose Add category data to product objects using category map
 * @param {Array} products - Array of product objects
 * @param {Object} categoryMap - Map of category ID to category data
 * @returns {Array} Products with enriched category information
 * @usedBy enrichWithCategories
 */
function enrichProductsWithCategories(products, categoryMap) {
  return products.map((product) => {
    const categories = [];

    if (product.extension_attributes && product.extension_attributes.category_links) {
      product.extension_attributes.category_links.forEach((link) => {
        const categoryData = categoryMap[link.category_id];
        if (categoryData) {
          categories.push({
            id: categoryData.id,
            name: categoryData.name,
            level: categoryData.level,
            position: link.position,
          });
        }
      });
    }

    return {
      ...product,
      enriched_categories: categories,
    };
  });
}

/**
 * Fetch inventory data from Commerce API
 * @purpose Retrieve inventory/stock information for given SKUs
 * @param {Array} skus - Array of product SKUs to fetch inventory for
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Object>} Map of SKU to inventory data
 * @usedBy enrichWithInventory
 */
async function fetchInventoryData(skus, config, params) {
  const inventoryRequests = skus.map((sku) => ({
    endpoint: `${config.commerce.paths.stockItems}/${sku}`,
    method: 'GET',
  }));

  const batchResponse = await executeBatchAuthenticatedRequests(inventoryRequests, config, params);

  const inventoryMap = {};
  batchResponse.forEach((response, index) => {
    if (response.success && response.data) {
      inventoryMap[skus[index]] = response.data;
    }
  });

  return inventoryMap;
}

/**
 * Enrich products with inventory information
 * @purpose Add inventory/stock data to product objects using inventory map
 * @param {Array} products - Array of product objects
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @returns {Array} Products with enriched inventory information
 * @usedBy enrichWithInventory
 */
function enrichProductsWithInventory(products, inventoryMap) {
  return products.map((product) => {
    const inventoryData = inventoryMap[product.sku];

    if (inventoryData) {
      return {
        ...product,
        inventory: {
          qty: inventoryData.qty || 0,
          is_in_stock: inventoryData.is_in_stock || false,
          stock_status: inventoryData.is_in_stock ? 'In Stock' : 'Out of Stock',
        },
      };
    }

    return {
      ...product,
      inventory: {
        qty: 0,
        is_in_stock: false,
        stock_status: 'Unknown',
      },
    };
  });
}

module.exports = {
  // Workflows (used by feature core)
  enrichWithCategories,
  enrichWithInventory,

  // Utilities (available for testing/extension)
  fetchCategoryData,
  fetchInventoryData,
  enrichProductsWithCategories,
  enrichProductsWithInventory,
};
