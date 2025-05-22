/**
 * Category-related API calls to Adobe Commerce
 * @module lib/api/categories
 */
const { buildHeaders } = require('../../../../core/http');
const { buildCommerceUrl, makeCommerceRequest } = require('../../../../commerce/integration');
const endpoints = require('./commerce-endpoints');

/**
 * Extract category IDs from a product
 * @param {Object} product - Product object
 * @returns {string[]} Array of category IDs
 */
function getCategoryIds(product) {
  const categoryIds = new Set();
  
  // Check category_ids array
  if (Array.isArray(product.category_ids)) {
    product.category_ids.forEach(id => categoryIds.add(String(id)));
  }
  
  // Check extension_attributes.category_links
  if (Array.isArray(product.extension_attributes?.category_links)) {
    product.extension_attributes.category_links.forEach(link => {
      if (link.category_id) {
        categoryIds.add(String(link.category_id));
      }
    });
  }
  
  return Array.from(categoryIds);
}

/**
 * Fetch category details from Adobe Commerce
 * @param {string} categoryId - Category ID
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @param {string} params.COMMERCE_URL - Commerce instance URL
 * @returns {Promise<Object>} Category details
 */
async function getCategory(categoryId, token, params) {
  try {
    const response = await makeCommerceRequest(
      buildCommerceUrl(params.COMMERCE_URL, endpoints.category(categoryId)),
      {
        method: 'GET',
        headers: buildHeaders(token)
      }
    );

    if (response.statusCode === 200) {
      return {
        id: categoryId,
        name: response.body.name
      };
    }
    
    console.warn(`Failed to fetch category ${categoryId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    return null;
  }
}

/**
 * Fetch categories for a product
 * @param {Object} product - Product object
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<string[]>} Array of category names
 */
async function getProductCategories(product, token, params) {
  const categoryIds = getCategoryIds(product);
  const categories = await Promise.all(
    categoryIds.map(id => getCategory(id, token, params))
  );
  
  return categories
    .filter(Boolean)
    .map(category => category.name);
}

/**
 * Gets unique category IDs from a list of products
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<string>} Array of unique category IDs
 */
function getUniqueCategoryIds(products) {
  const allIds = products.flatMap(product => getCategoryIds(product));
  return Array.from(new Set(allIds));
}

/**
 * Builds a map of category IDs to category names
 * @param {Array<Object>} products - Array of product objects
 * @param {string} token - Authentication token
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Map of category IDs to names
 */
async function buildCategoryMap(products, token, params) {
  const categoryIds = getUniqueCategoryIds(products);
  const categoryMap = {};

  await Promise.all(
    categoryIds.map(async (categoryId) => {
      const category = await getCategory(categoryId, token, params);
      if (category) {
        categoryMap[String(categoryId)] = category.name;
      }
    })
  );

  return categoryMap;
}

module.exports = {
  getCategoryIds,
  getCategory,
  getProductCategories,
  getUniqueCategoryIds,
  buildCategoryMap
}; 