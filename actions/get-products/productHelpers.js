/**
 * Product-related helper functions for get-products action
 */

const fetch = require('node-fetch');
const { buildHeaders, getBearerToken, fetchAdminToken } = require('../utils');
const endpoints = require('./magentoEndpoints');

function getMagentoConfig(params) {
  return {
    username: params.MAGENTO_ADMIN_USERNAME,
    password: params.MAGENTO_ADMIN_PASSWORD,
    apiBaseUrl: params.MAGENTO_API_BASE_URL || 'https://com774.adobedemo.com',
    consumerKey: params.MAGENTO_CONSUMER_KEY,
    consumerSecret: params.MAGENTO_CONSUMER_SECRET,
    accessToken: params.MAGENTO_ACCESS_TOKEN,
    accessTokenSecret: params.MAGENTO_ACCESS_TOKEN_SECRET
  };
}

/**
 * Fetch all products from the Adobe Commerce REST API with pagination.
 * @param {string} token - Bearer token for authentication
 * @param {string} apiBaseUrl - Base URL for the Magento API
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAllProducts(token, magentoConfig) {
  let currentPage = 1;
  const pageSize = 200;
  let allProducts = [];
  let totalCount = 0;
  const restEndpoint = endpoints.products(magentoConfig.apiBaseUrl);

  do {
    const url = `${restEndpoint}?searchCriteria[currentPage]=${currentPage}&searchCriteria[pageSize]=${pageSize}`;
    const res = await fetch(url, {
      headers: buildHeaders(token)
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    allProducts = allProducts.concat(data.items);
    totalCount = data.total_count;
    currentPage++;
  } while (allProducts.length < totalCount);

  return allProducts;
}

/**
 * Fetch inventory (qty) for a given SKU from the REST API.
 * @param {string} sku - The product SKU
 * @param {string} token - Bearer token for authentication
 * @param {string} apiBaseUrl - Base URL for the Magento API
 * @returns {Promise<number|undefined>} The quantity or undefined if not found
 */
async function fetchProductQty(sku, token, magentoConfig) {
  const url = endpoints.stockItem(magentoConfig.apiBaseUrl, sku);
  const res = await fetch(url, {
    headers: buildHeaders(token)
  });
  if (!res.ok) {
    return undefined;
  }
  const data = await res.json();
  return data.qty;
}

/**
 * Fetch category details for a given category ID from the REST API.
 * @param {number|string} categoryId - The category ID
 * @param {string} token - Bearer token for authentication
 * @param {string} apiBaseUrl - Base URL for the Magento API
 * @returns {Promise<{id: number, name: string}|undefined>} The category object or undefined if not found
 */
async function fetchCategory(categoryId, token, magentoConfig) {
  const url = endpoints.category(magentoConfig.apiBaseUrl, categoryId);
  const res = await fetch(url, {
    headers: buildHeaders(token)
  });
  if (!res.ok) {
    return undefined;
  }
  const data = await res.json();
  return { id: data.id, name: data.name };
}

/**
 * Extracts category IDs from a product object.
 * @param {object} product - The product object
 * @returns {Array<string>} Array of category IDs
 */
function getCategoryIds(product) {
  // Try extension_attributes.category_links first
  if (
    product.extension_attributes &&
    Array.isArray(product.extension_attributes.category_links)
  ) {
    return product.extension_attributes.category_links
      .map(link => link.category_id)
      .filter(Boolean);
  }
  // Fallback to custom_attributes
  if (Array.isArray(product.custom_attributes)) {
    const catAttr = product.custom_attributes.find(attr => attr.attribute_code === 'category_ids');
    if (catAttr && Array.isArray(catAttr.value)) {
      return catAttr.value;
    }
  }
  return [];
}

/**
 * Returns the list of fields to include in the response, based on params.fields or a default set.
 * @param {object} params - The action input parameters
 * @returns {Array<string>} Array of field names
 */
function getRequestedFields(params) {
  const defaultFields = ['sku', 'name', 'price', 'qty', 'categories', 'images'];
  return Array.isArray(params.fields) && params.fields.length > 0 ? params.fields : defaultFields;
}

/**
 * Builds a product object with only the requested fields.
 * @param {object} product - The product object
 * @param {Array<string>} requestedFields - Fields to include
 * @param {object} categoryMap - Map of categoryId to categoryName
 * @returns {object}
 */
function buildProductObject(product, requestedFields, categoryMap) {
  const result = {};
  if (requestedFields.includes('sku')) result.sku = product.sku;
  if (requestedFields.includes('name')) result.name = product.name;
  if (requestedFields.includes('price')) result.price = product.price;
  if (requestedFields.includes('qty')) result.qty = product.qty;
  if (requestedFields.includes('categories')) {
    result.categories = (product.category_ids || []).map(id => categoryMap[String(id)]).filter(Boolean);
  }
  if (requestedFields.includes('images')) {
    result.images = (product.media_gallery_entries || []).map(img => {
      const imageObj = {
        filename: img.file,
        position: img.position
      };
      if (img.types && img.types.length > 0) {
        imageObj.roles = img.types;
      }
      return imageObj;
    });
  }
  return result;
}

/**
 * Resolves the Bearer token to use for API calls.
 * @param {object} params - Action input parameters
 * @param {object} logger - Logger instance
 * @returns {Promise<string>} The Bearer token
 */
async function resolveToken(params, logger, magentoConfig) {
  const incomingToken = getBearerToken(params);
  if (incomingToken) {
    logger.info('Using Bearer token from Authorization header');
    return incomingToken;
  } else {
    logger.info('Fetching admin token using admin credentials');
    return await fetchAdminToken(magentoConfig);
  }
}

/**
 * Enriches products with inventory and category IDs.
 * @param {Array<object>} products - Array of product objects
 * @param {string} token - Bearer token
 * @param {string} apiBaseUrl - Base URL for the Magento API
 * @returns {Promise<Array<object>>} Enriched products
 */
async function enrichWithInventory(products, token, magentoConfig) {
  const { fetchProductQty, getCategoryIds } = module.exports;
  return Promise.all(products.map(async (product) => {
    const qty = await fetchProductQty(product.sku, token, magentoConfig);
    const category_ids = getCategoryIds(product);
    return { ...product, qty, price: product.price, category_ids };
  }));
}

/**
 * Builds a map of category IDs to category names.
 * @param {Array<object>} products - Array of product objects (with category_ids)
 * @param {string} token - Bearer token
 * @param {string} apiBaseUrl - Base URL for the Magento API
 * @returns {Promise<object>} Map of categoryId to categoryName
 */
async function buildCategoryMap(products, token, magentoConfig) {
  const { fetchCategory } = module.exports;
  const allCategoryIds = Array.from(new Set(products.flatMap(p => p.category_ids || [])));
  const categoryMap = {};
  await Promise.all(allCategoryIds.map(async (categoryId) => {
    const category = await fetchCategory(categoryId, token, magentoConfig);
    if (category) {
      categoryMap[String(categoryId)] = category.name;
    }
  }));
  return categoryMap;
}

module.exports = {
  getMagentoConfig,
  fetchAllProducts,
  fetchProductQty,
  fetchCategory,
  getCategoryIds,
  getRequestedFields,
  buildProductObject,
  resolveToken,
  enrichWithInventory,
  buildCategoryMap
}; 