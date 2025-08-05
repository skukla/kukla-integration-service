/**
 * Adobe Commerce Products Module
 * Handles product fetching operations following Adobe standards
 */

const { fetchCommerceData } = require('../utils');

/**
 * Fetch products from Commerce API
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Promise<Array>} Array of products
 */
async function fetchProducts(params, config, bearerToken) {
  const { baseUrl, api } = config.commerce;
  const productsUrl = `${baseUrl}/rest/${api.version}${api.paths.products}?searchCriteria[pageSize]=${config.products.expectedCount}`;

  const products = await fetchCommerceData(productsUrl, bearerToken, 'GET', 'Products');

  // fetchCommerceData handles empty arrays, but let's ensure we have items
  if (!Array.isArray(products)) {
    throw new Error('Products fetch failed: Invalid response format');
  }

  return products;
}

/**
 * Transform mesh products to REST API format
 * @param {Array} products - Mesh product data
 * @param {Object} config - Configuration object
 * @returns {Array} Transformed products
 */
function transformMeshProductsToRestFormat(products, config) {
  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    // Extract price from Commerce API standard format
    price: product.price || 0,
    price_range: {
      minimum_price: {
        regular_price: { value: product.price || 0, currency: 'USD' },
        final_price: { value: product.price || 0, currency: 'USD' },
      },
    },
    status: product.status || 1,
    type_id: product.type_id || 'simple',
    qty: product.inventory?.qty || product.qty || 0,
    stock_status: product.inventory?.is_in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    categories: product.categories,
    // Map images correctly for buildProducts function
    images: product.media_gallery_entries
      ? product.media_gallery_entries.map((img) => ({
          url: img.url || `${config.commerce.baseUrl}/media/catalog/product${img.file}`,
          file: img.file,
          position: img.position,
          types: img.types || ['image'],
        }))
      : [],
    // Add missing fields that buildProducts expects
    message: '', // Commerce API doesn't provide this, so empty
    page_url: `${config.commerce.baseUrl}/catalog/product/view/sku/${product.sku}`, // Generate product page URL
    type: 'product',
    custom_attributes: product.custom_attributes,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }));
}

module.exports = {
  fetchProducts,
  transformMeshProductsToRestFormat,
};
