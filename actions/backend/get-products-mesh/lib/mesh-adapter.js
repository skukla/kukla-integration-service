/**
 * Mesh Adapter for Commerce API Integration
 * @module get-products-mesh/lib/mesh-adapter
 *
 * This adapter module reuses ALL existing Commerce utilities while adapting
 * them for the get-products-mesh action's specific needs. This eliminates code
 * duplication while keeping mesh-specific adaptations localized to this action.
 *
 * The adapter provides two strategies:
 * - fetchProductsWithExistingUtils: Reuses existing Commerce utilities (recommended)
 * - fetchProductsDirectAPI: Direct API calls (fallback if adaptation needed)
 */

const { loadConfig } = require('../../../../config');
const { getAuthToken } = require('../../../../src/commerce/api/integration');
const { enrichProductsWithCategories } = require('../../../get-products/lib/api/categories');
const { fetchAllProducts } = require('../../../get-products/lib/api/products');

/**
 * Get Commerce configuration and authenticated context
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Commerce context with config, token, and baseUrl
 */
async function getCommerceContext(params) {
  const config = loadConfig(params);
  const token = await getAuthToken(params);
  const baseUrl = config.commerce.baseUrl;

  return {
    config,
    token,
    baseUrl,
  };
}

/**
 * Fetch and enrich products using existing Commerce utilities
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of enriched product objects
 */
async function fetchProductsWithExistingUtils(params) {
  // Use the EXACT same logic as get-products action
  const token = await getAuthToken(params);

  // Fetch products using existing utility
  const rawProducts = await fetchAllProducts(token, params);

  // Enrich with categories using existing utility
  const enrichedProducts = await enrichProductsWithCategories(rawProducts, token, params);

  return enrichedProducts;
}

/**
 * Alternative: Direct Commerce API calls (fallback if utilities need adaptation)
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of enriched product objects
 */
async function fetchProductsDirectAPI(params, config) {
  const { token, baseUrl } = await getCommerceContext(params);
  const { pageSize, maxPages } = config.commerce.product.pagination;

  let allProducts = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages && page <= maxPages) {
    const productsUrl =
      baseUrl +
      '/rest/V1/products?searchCriteria[pageSize]=' +
      pageSize +
      '&searchCriteria[currentPage]=' +
      page;

    const response = await fetch(productsUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products: ' + response.status);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Enrich each product with inventory data
      const enrichedProducts = await Promise.all(
        data.items.map(async (product) => {
          const inventory = await getInventoryData(product.sku, token, baseUrl);
          return { ...product, ...inventory };
        })
      );

      allProducts = allProducts.concat(enrichedProducts);

      // Check pagination
      const totalPages = Math.ceil(data.total_count / pageSize);
      hasMorePages = page < totalPages;
      page++;
    } else {
      hasMorePages = false;
    }
  }

  // Enrich with categories
  const categoryMap = await getCategoryMap(token, baseUrl);
  return enrichProductsWithCategoryNames(allProducts, categoryMap);
}

/**
 * Helper: Get inventory data for a product
 * @param {string} sku - Product SKU
 * @param {string} token - Auth token
 * @param {string} baseUrl - Commerce base URL
 * @returns {Promise<Object>} Inventory data
 */
async function getInventoryData(sku, token, baseUrl) {
  try {
    const inventoryUrl = baseUrl + '/rest/V1/stockItems/' + sku;
    const response = await fetch(inventoryUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const inventoryData = await response.json();
      return {
        qty: inventoryData.qty || 0,
        is_in_stock: inventoryData.is_in_stock || false,
      };
    }
  } catch (error) {
    // Fallback to default values
  }

  return { qty: 0, is_in_stock: false };
}

/**
 * Helper: Get category mapping
 * @param {string} token - Auth token
 * @param {string} baseUrl - Commerce base URL
 * @returns {Promise<Object>} Category ID to name mapping
 */
async function getCategoryMap(token, baseUrl) {
  try {
    const categoryUrl = baseUrl + '/rest/V1/categories?searchCriteria[pageSize]=100';
    const response = await fetch(categoryUrl, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const categoryData = await response.json();
      const categoryMap = {};

      if (categoryData.items) {
        categoryData.items.forEach((category) => {
          categoryMap[category.id] = category.name;
        });
      }

      return categoryMap;
    }
  } catch (error) {
    // Fallback to empty map
  }

  return {};
}

/**
 * Helper: Enrich products with category names
 * @param {Array} products - Products array
 * @param {Object} categoryMap - Category mapping
 * @returns {Array} Enriched products
 */
function enrichProductsWithCategoryNames(products, categoryMap) {
  return products.map((product) => {
    const categoryNames = [];
    if (product.category_ids && Array.isArray(product.category_ids)) {
      product.category_ids.forEach((catId) => {
        if (categoryMap[catId]) {
          categoryNames.push(categoryMap[catId]);
        }
      });
    }

    return {
      ...product,
      category_names: categoryNames.join(', ') || 'Uncategorized',
    };
  });
}

module.exports = {
  getCommerceContext,
  fetchProductsWithExistingUtils,
  fetchProductsDirectAPI,
};
