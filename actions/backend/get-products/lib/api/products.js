/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const commerceEndpoints = require('./commerce-endpoints');
const { loadConfig } = require('../../../../../config');
const { getRequestedFields } = require('../../../../../src/commerce/data/product');
const { request, buildHeaders } = require('../../../../../src/core/http/client');
const { buildCommerceUrl } = require('../../../../../src/core/routing');
const { MemoryCache } = require('../../../../../src/core/storage/cache');

// Load configuration
const config = loadConfig();
const {
  api: {
    cache: { duration: CACHE_TTL },
  },
} = config.commerce;

// Extract product fields at module load time to ensure availability
const FALLBACK_PRODUCT_FIELDS = ['sku', 'name', 'price', 'qty', 'categories', 'images'];
const PRODUCT_FIELDS = config.commerce?.product?.fields || FALLBACK_PRODUCT_FIELDS;

/**
 * Make a cached request
 * @private
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeCachedRequest(url, options) {
  const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
  const cached = MemoryCache.get(cacheKey, { ttl: CACHE_TTL });
  if (cached) {
    return cached;
  }
  const response = await request(url, options);
  MemoryCache.set(cacheKey, response);
  return response;
}

/**
 * Filter product fields based on configuration
 * @param {Object} product - The product object
 * @param {Array} fields - Array of field names to include
 * @returns {Object} Filtered product object
 */
function filterProductFields(product, fields) {
  // Validate inputs
  if (!Array.isArray(fields)) {
    return product;
  }

  if (!product || typeof product !== 'object') {
    return {};
  }

  // Create filtered product with only requested fields
  const filteredProduct = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(product, field)) {
      filteredProduct[field] = product[field];
    }
  });

  // Always preserve media_gallery_entries if present, as it's needed for image transformation
  if (product.media_gallery_entries && fields.includes('images')) {
    filteredProduct.media_gallery_entries = product.media_gallery_entries;
  }

  return filteredProduct;
}

/**
 * Fetch inventory data for a product
 * @param {string} sku - Product SKU
 * @param {string} token - Authentication token
 * @param {string} baseUrl - Commerce base URL
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, token, baseUrl) {
  const endpoint = commerceEndpoints.stockItem(sku);
  const url = buildCommerceUrl(baseUrl, endpoint);
  const response = await makeCachedRequest(url, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  if (response.body && Array.isArray(response.body.items) && response.body.items.length > 0) {
    const totalQty = response.body.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const isInStock = response.body.items.some((item) => item.status === 1);
    return {
      qty: totalQty,
      is_in_stock: isInStock,
    };
  }
  return {
    qty: 0,
    is_in_stock: false,
  };
}

/**
 * Fetches all products with pagination and enriches them with inventory data
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Array of products
 */
async function fetchAllProducts(token, params = {}) {
  const { COMMERCE_URL } = params;
  if (!COMMERCE_URL) {
    throw new Error('COMMERCE_URL is required');
  }

  try {
    // Get pagination settings from config
    const { product: { pagination: { pageSize = 100, maxPages = 50 } = {} } = {} } =
      config.commerce || {};

    let allProducts = [];
    let currentPage = 1;
    let totalPages = 1;

    // Get the fields to include (declare once outside the loop)
    let fields;
    try {
      fields = getRequestedFields(params);
    } catch (error) {
      fields = PRODUCT_FIELDS;
    }

    // Ensure fields is always an array (defensive programming)
    if (!Array.isArray(fields)) {
      fields = PRODUCT_FIELDS;
    }

    // Create immutable copy to ensure proper closure capture
    const fieldsForProcessing = [...fields];

    do {
      const paginatedParams = {
        ...params,
        pageSize,
        currentPage,
      };

      const endpoint = commerceEndpoints.products(paginatedParams);
      const url = buildCommerceUrl(COMMERCE_URL, endpoint);

      const response = await makeCachedRequest(url, {
        method: 'GET',
        headers: buildHeaders(token),
      });

      if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
        break;
      }

      // Get total pages on first request
      if (currentPage === 1) {
        totalPages = Math.ceil(response.body.total_count / pageSize);
        // Respect maxPages configuration
        totalPages = Math.min(totalPages, maxPages);
      }

      // Enrich products with inventory data and filter fields
      const enrichedProducts = await Promise.all(
        response.body.items.map(async (product) => {
          try {
            const inventory = await getInventory(product.sku, token, COMMERCE_URL);
            const enrichedProduct = {
              ...product,
              ...inventory,
            };
            return filterProductFields(enrichedProduct, fieldsForProcessing);
          } catch (inventoryError) {
            return filterProductFields(product, fieldsForProcessing);
          }
        })
      );

      allProducts = allProducts.concat(enrichedProducts);
      currentPage++;

      // Add a small delay between requests to avoid rate limiting
      if (currentPage <= totalPages) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } while (currentPage <= totalPages);

    return allProducts;
  } catch (error) {
    console.error('Error in fetchAllProducts:', error.message);
    throw error;
  }
}

/**
 * Get products from Adobe Commerce
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object[]>} Array of product objects
 */
async function getProducts(token, params) {
  return fetchAllProducts(token, params);
}

module.exports = {
  getProducts,
  fetchAllProducts,
};
