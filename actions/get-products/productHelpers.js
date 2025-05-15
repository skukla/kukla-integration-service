/**
 * Product-related helper functions for get-products action
 */

const fetch = require('node-fetch');
const { buildHeaders, getBearerToken, fetchAdminToken } = require('../utils');
const endpoints = require('./magentoEndpoints');

/**
 * Fetch all products from the Adobe Commerce REST API with pagination.
 * @param {string} token - Bearer token for authentication
 * @param {object} params - Action input parameters
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchAllProducts(token, params) {
  let currentPage = 1;
  const pageSize = 200;
  let allProducts = [];
  let totalCount = 0;
  const restEndpoint = endpoints.products(params.COMMERCE_URL);

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
 * @param {object} params - Action input parameters
 * @returns {Promise<number|undefined>} The quantity or undefined if not found
 */
async function fetchProductQty(sku, token, params) {
  const url = endpoints.stockItem(params.COMMERCE_URL, sku);
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
 * @param {object} params - Action input parameters
 * @returns {Promise<{id: number, name: string}|undefined>} The category object or undefined if not found
 */
async function fetchCategory(categoryId, token, params) {
  const url = endpoints.category(params.COMMERCE_URL, categoryId);
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
  // Check for category links in extension attributes
  const categoryLinks = product.extension_attributes?.category_links;
  if (Array.isArray(categoryLinks)) {
    return categoryLinks
      .map(link => link.category_id)
      .filter(Boolean);
  }

  // Check for category IDs in custom attributes
  const customAttributes = product.custom_attributes;
  if (Array.isArray(customAttributes)) {
    const categoryAttribute = customAttributes.find(attr => attr.attribute_code === 'category_ids');
    if (categoryAttribute?.value && Array.isArray(categoryAttribute.value)) {
      return categoryAttribute.value;
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
 * Transforms a media gallery entry into a simplified image object.
 * @param {object} img - Media gallery entry
 * @returns {object} Simplified image object
 */
function transformImageEntry(img) {
  const imageObj = {
    filename: img.file,
    position: img.position
  };
  if (img.types && img.types.length > 0) {
    imageObj.roles = img.types;
  }
  return imageObj;
}

/**
 * Builds a product object with only the requested fields.
 * @param {object} product - The product object
 * @param {Array<string>} requestedFields - Fields to include
 * @param {object} categoryMap - Map of categoryId to categoryName
 * @returns {object}
 */
function buildProductObject(product, requestedFields, categoryMap) {
  const fieldMappings = {
    sku: () => product.sku,
    name: () => product.name,
    price: () => product.price,
    qty: () => product.qty,
    categories: () => (product.category_ids || [])
      .map(id => categoryMap[String(id)])
      .filter(Boolean),
    images: () => (product.media_gallery_entries || [])
      .map(transformImageEntry)
  };

  return requestedFields.reduce((result, field) => {
    if (fieldMappings[field]) {
      result[field] = fieldMappings[field]();
    }
    return result;
  }, {});
}

/**
 * Resolves the Bearer token to use for API calls.
 * @param {object} params - Action input parameters
 * @param {object} logger - Logger instance
 * @returns {Promise<string>} The Bearer token
 */
async function resolveToken(params, logger) {
  const incomingToken = getBearerToken(params);
  if (incomingToken) {
    logger.info('Using Bearer token from Authorization header');
    return incomingToken;
  } else {
    logger.info('Fetching admin token using admin credentials');
    // Pass COMMERCE_ parameters directly to fetchAdminToken
    return await fetchAdminToken(params);
  }
}

/**
 * Enriches products with inventory and category IDs.
 * @param {Array<object>} products - Array of product objects
 * @param {string} token - Bearer token
 * @param {object} params - Action input parameters
 * @returns {Promise<Array<object>>} Enriched products
 */
async function enrichWithInventory(products, token, params) {
  return Promise.all(products.map(async (product) => {
    const qty = await fetchProductQty(product.sku, token, params);
    const category_ids = getCategoryIds(product);
    return { ...product, qty, category_ids };
  }));
}

/**
 * Gets unique category IDs from a list of products.
 * @param {Array<object>} products - Array of product objects
 * @returns {Array<string>} Array of unique category IDs
 */
function getUniqueCategoryIds(products) {
  return Array.from(
    new Set(
      products.flatMap(product => product.category_ids || [])
    )
  );
}

/**
 * Builds a map of category IDs to category names.
 * @param {Array<object>} products - Array of product objects (with category_ids)
 * @param {string} token - Bearer token
 * @param {object} params - Action input parameters
 * @returns {Promise<object>} Map of categoryId to categoryName
 */
async function buildCategoryMap(products, token, params) {
  const uniqueCategoryIds = getUniqueCategoryIds(products);
  const categoryMap = {};

  await Promise.all(
    uniqueCategoryIds.map(async (categoryId) => {
      const category = await fetchCategory(categoryId, token, params);
      if (category) {
        categoryMap[String(categoryId)] = category.name;
      }
    })
  );

  return categoryMap;
}

module.exports = {
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