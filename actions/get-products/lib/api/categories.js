/**
 * Category-related API calls to Adobe Commerce
 * @module api/categories
 */

const fetch = require('node-fetch');
const { buildHeaders } = require('../../../utils');
const endpoints = require('../commerce-endpoints');

/**
 * Fetch category details for a given category ID from the REST API.
 * @async
 * @param {number|string} categoryId - The category ID
 * @param {string} token - Bearer token for authentication
 * @param {Object} params - Action input parameters
 * @param {string} params.COMMERCE_URL - Adobe Commerce instance URL
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
 * @param {Object} product - The product object from Adobe Commerce
 * @param {Object} [product.extension_attributes] - Extension attributes containing category links
 * @param {Array<Object>} [product.extension_attributes.category_links] - Category link objects
 * @param {Array<Object>} [product.custom_attributes] - Custom attributes array
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
 * Gets unique category IDs from a list of products.
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<string>} Array of unique category IDs
 */
function getUniqueCategoryIds(products) {
  const allIds = products.flatMap(product => getCategoryIds(product));
  return Array.from(new Set(allIds));
}

/**
 * Builds a map of category IDs to category names.
 * @async
 * @param {Array<Object>} products - Array of product objects
 * @param {string} token - Bearer token for authentication
 * @param {Object} params - Action input parameters
 * @returns {Promise<Object<string, string>>} Map of category IDs to names
 */
async function buildCategoryMap(products, token, params) {
  const categoryIds = getUniqueCategoryIds(products);
  const categoryMap = {};

  await Promise.all(
    categoryIds.map(async (categoryId) => {
      const category = await fetchCategory(categoryId, token, params);
      if (category) {
        categoryMap[String(categoryId)] = category.name;
      }
    })
  );
  
  return categoryMap;
}

module.exports = {
  fetchCategory,
  getCategoryIds,
  getUniqueCategoryIds,
  buildCategoryMap
}; 