/**
 * Adobe Commerce Categories Module
 * Handles category data operations following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Extract unique category IDs from products
 * @param {Array} products - Array of products
 * @returns {Set} Set of unique category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();
  products.forEach((product) => {
    if (product.extension_attributes && product.extension_attributes.category_links) {
      product.extension_attributes.category_links.forEach((link) => {
        categoryIds.add(link.category_id);
      });
    }
  });
  return categoryIds;
}

/**
 * Fetch categories using batch endpoint
 * @param {Array} categoryIds - Array of category IDs
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Array>} Array of category data
 */
async function fetchCategoriesBatch(categoryIds, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-categories');
  const categoryIdsStr = categoryIds.join(',');
  const searchCriteria = `searchCriteria[pageSize]=20&searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]=${categoryIdsStr}&searchCriteria[filter_groups][0][filters][0][condition_type]=in`;
  const url = `${baseUrl}/rest/${api.version}/categories/list?${searchCriteria}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!response.ok) {
      log.warn('Category batch fetch failed', {
        categoryIds: categoryIds.length,
        status: response.status,
      });
      return [];
    }

    const result = await response.json();
    const categories = result.items || [];

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      level: category.level,
      path: category.path,
    }));
  } catch (error) {
    log.warn('Category batch fetch error', {
      categoryIds: categoryIds.length,
      error: error.message,
    });
    return [];
  }
}

module.exports = {
  extractCategoryIds,
  fetchCategoriesBatch,
};
