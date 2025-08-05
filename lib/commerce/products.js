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
 * Simplified transformation with helper functions
 * @param {Array} products - Mesh product data
 * @param {Object} config - Configuration object
 * @returns {Array} Transformed products
 */
function transformMeshProductsToRestFormat(products, config) {
  return products.map((product) => transformSingleProduct(product, config));
}

/**
 * Transform a single mesh product to REST format
 * @param {Object} product - Single product from mesh
 * @param {Object} config - Configuration object
 * @returns {Object} Transformed product
 */
function transformSingleProduct(product, config) {
  const price = product.price || 0;
  const qty = product.inventory?.qty || product.qty || 0;
  const isInStock = product.inventory?.is_in_stock || false;

  return {
    // Basic product fields
    id: product.id,
    sku: product.sku,
    name: product.name,
    price,
    status: product.status || 1,
    type_id: product.type_id || 'simple',
    qty,
    stock_status: isInStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    categories: product.categories,
    images: transformImages(product.media_gallery_entries, config),
    custom_attributes: product.custom_attributes,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

/**
 * Transform media gallery entries to image format
 */
function transformImages(mediaEntries, config) {
  if (!mediaEntries || !Array.isArray(mediaEntries)) {
    return [];
  }

  return mediaEntries.map((img) => {
    let url = '';

    // First check if img.url exists and is already a full URL
    if (img.url && (img.url.startsWith('http://') || img.url.startsWith('https://'))) {
      url = img.url;
    }
    // Then check if img.file is an AEM Assets URL (Adobe Assets migration)
    else if (img.file && (img.file.startsWith('http://') || img.file.startsWith('https://'))) {
      url = img.file; // Use AEM delivery URL directly
    }
    // Otherwise, construct the URL from file path (legacy Commerce media)
    else if (img.file) {
      url = `${config.commerce.baseUrl}/media/catalog/product${img.file}`;
    }

    return {
      url,
      file: img.file,
      position: img.position,
      types: img.types || ['image'],
    };
  });
}

module.exports = {
  fetchProducts,
  transformMeshProductsToRestFormat,
};
