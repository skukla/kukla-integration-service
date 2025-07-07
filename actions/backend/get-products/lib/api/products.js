/**
 * Product-related API calls to Adobe Commerce
 * @module lib/api/products
 */
const commerceEndpoints = require('./commerce-endpoints');
const { getRequestedFields } = require('../../../../../src/commerce/data/product');
const { MemoryCache } = require('../../../../../src/files/cache');
const { request, buildHeaders } = require('../../../../../src/shared/http/client');
const { buildCommerceUrl } = require('../../../../../src/shared/routing');

/**
 * Make a cached request
 * @private
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Response data
 */
async function makeCachedRequest(url, options, config) {
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
 * @param {Object} apiContext - API context
 * @param {string} apiContext.token - Authentication token
 * @param {string} apiContext.baseUrl - Commerce base URL
 * @param {Object} apiContext.config - Configuration object
 * @returns {Promise<Object>} Inventory data
 */
async function getInventory(sku, apiContext) {
  const { token, baseUrl, config } = apiContext;
  const endpoint = commerceEndpoints.stockItem(sku, config);
  const url = buildCommerceUrl(baseUrl, endpoint);
  const response = await makeCachedRequest(
    url,
    {
      method: 'GET',
      headers: buildHeaders(token),
    },
    config
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
 * Initializes pagination configuration and validates setup
 * @param {Object} config - Configuration object
 * @param {Object} params - Request parameters
 * @returns {Object} Pagination configuration and field settings
 */
function initializePaginationConfig(config, params) {
  const commerceUrl = config.commerce.baseUrl;
  if (!commerceUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  const paginationConfig = {
    pageSize: config.products.perPage,
    maxPages: config.products.maxTotal / config.products.perPage,
  };

  // Get the fields to include with error handling
  let fields;
  try {
    fields = getRequestedFields(params, config);
  } catch (error) {
    fields = config.products.fields;
  }

  // Ensure fields is always an array (defensive programming)
  if (!Array.isArray(fields)) {
    fields = config.products.fields;
  }

  return {
    commerceUrl,
    paginationConfig,
    fieldsForProcessing: [...fields], // Create immutable copy
  };
}

/**
 * Fetches and validates a single page of products
 * @param {Object} apiContext - API context
 * @param {string} apiContext.token - Authentication token
 * @param {string} apiContext.commerceUrl - Commerce base URL
 * @param {Object} apiContext.params - Request parameters
 * @param {Object} paginationData - Pagination data
 * @param {number} paginationData.pageSize - Page size
 * @param {number} paginationData.currentPage - Current page number
 * @returns {Promise<Object>} Page response with products
 */
async function fetchProductPage(apiContext, paginationData) {
  const { token, commerceUrl, params, config } = apiContext;
  const { pageSize, currentPage } = paginationData;

  const paginatedParams = {
    ...params,
    pageSize,
    currentPage,
  };

  const endpoint = commerceEndpoints.products(paginatedParams, config);
  const url = buildCommerceUrl(commerceUrl, endpoint);

  const response = await makeCachedRequest(
    url,
    {
      method: 'GET',
      headers: buildHeaders(token),
    },
    config
  );

  if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
    return null;
  }

  return response;
}

/**
 * Enriches products with inventory data and applies field filtering
 * @param {Array} products - Products to enrich
 * @param {Object} apiContext - API context and configuration
 * @param {string} apiContext.token - Authentication token
 * @param {string} apiContext.commerceUrl - Commerce base URL
 * @param {Object} apiContext.params - Request parameters
 * @param {Array} fieldsForProcessing - Fields to include
 * @returns {Promise<Array>} Enriched and filtered products
 */
async function enrichProductsWithInventoryData(products, apiContext, fieldsForProcessing) {
  const { token, commerceUrl, config } = apiContext;

  return await Promise.all(
    products.map(async (product) => {
      try {
        const inventory = await getInventory(product.sku, {
          token,
          baseUrl: commerceUrl,
          config,
        });
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
}

/**
 * Fetches all products with pagination and enriches them with inventory data
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of products
 */
async function fetchAllProducts(token, params = {}, config) {
  try {
    const { commerceUrl, paginationConfig, fieldsForProcessing } = initializePaginationConfig(
      config,
      params
    );
    const { pageSize, maxPages } = paginationConfig;

    let allProducts = [];
    let currentPage = 1;
    let totalPages = 1;

    // Create API context once for reuse
    const apiContext = { token, commerceUrl, params, config };

    do {
      const paginationData = { pageSize, currentPage };
      const response = await fetchProductPage(apiContext, paginationData);
      if (!response) {
        break;
      }

      // Get total pages on first request
      if (currentPage === 1) {
        totalPages = Math.ceil(response.body.total_count / pageSize);
        totalPages = Math.min(totalPages, maxPages); // Respect maxPages configuration
      }

      // Enrich products with inventory data and filter fields
      const enrichedProducts = await enrichProductsWithInventoryData(
        response.body.items,
        apiContext,
        fieldsForProcessing
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
 * @param {Object} config - Configuration object
 * @returns {Promise<Object[]>} Array of product objects
 */
async function getProducts(token, params, config) {
  return fetchAllProducts(token, params, config);
}

module.exports = {
  getProducts,
  fetchAllProducts,
};
