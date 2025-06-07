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

/**
 * Make a cached request
 * @private
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Promise<Object>} Response data
 */
async function makeCachedRequest(url, options, params = {}) {
  const config = loadConfig(params);
  const cacheKey = `commerce:request:${url}:${JSON.stringify(options)}`;
  const cached = MemoryCache.get(cacheKey, { ttl: config.commerce.caching.duration });
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
 * @param {Object} [params] - Action parameters for configuration
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, token, baseUrl, params = {}) {
  const endpoint = commerceEndpoints.stockItem(sku, params);
  const url = buildCommerceUrl(baseUrl, endpoint);
  const response = await makeCachedRequest(
    url,
    {
      method: 'GET',
      headers: buildHeaders(token),
    },
    params
  );

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
  // Get Commerce URL from configuration
  const config = loadConfig(params);
  const commerceUrl = config.commerce.baseUrl;

  if (!commerceUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  try {
    // Get pagination configuration
    const { pageSize, maxPages } = {
      pageSize: config.products.perPage,
      maxPages: config.products.maxTotal / config.products.perPage,
    };

    let allProducts = [];
    let currentPage = 1;
    let totalPages = 1;

    // Get the fields to include (declare once outside the loop)
    let fields;
    try {
      fields = getRequestedFields(params);
    } catch (error) {
      fields = config.products.fields;
    }

    // Ensure fields is always an array (defensive programming)
    if (!Array.isArray(fields)) {
      fields = config.products.fields;
    }

    // Create immutable copy to ensure proper closure capture
    const fieldsForProcessing = [...fields];

    do {
      const paginatedParams = {
        ...params,
        pageSize,
        currentPage,
      };

      const endpoint = commerceEndpoints.products(paginatedParams, params);
      const url = buildCommerceUrl(commerceUrl, endpoint);

      const response = await makeCachedRequest(
        url,
        {
          method: 'GET',
          headers: buildHeaders(token),
        },
        params
      );

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
            const inventory = await getInventory(product.sku, token, commerceUrl, params);
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
