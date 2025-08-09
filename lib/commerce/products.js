/**
 * Adobe Commerce Products Module
 * Handles product fetching operations following Adobe standards
 */

const { fetchCommerceData } = require('../utils');

/**
 * Fetch products from Commerce API with pagination
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Promise<Object>} Object with products array and apiCallCount
 */
async function fetchProducts(params, config, bearerToken) {
  const { baseUrl, api } = config.commerce;
  const pageSize = config.commerce.pagination.pageSize;
  let currentPage = config.commerce.pagination.defaultPage;
  let allProducts = [];
  let apiCallCount = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const productsUrl = `${baseUrl}/rest/${api.version}${api.paths.products}?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`;

    const response = await fetchCommerceData(productsUrl, bearerToken, 'GET', 'Products');
    apiCallCount++;

    if (!response.items || !Array.isArray(response.items)) {
      throw new Error(`Products fetch failed on page ${currentPage}: Invalid response format`);
    }

    allProducts = allProducts.concat(response.items);

    // Check if we have more pages
    const totalItems = response.total_count || 0;
    const currentItemCount = currentPage * pageSize;
    hasMorePages = response.items.length === pageSize && currentItemCount < totalItems;

    currentPage++;
  }

  return {
    products: allProducts,
    apiCallCount,
  };
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
  const qty = product.inventory?.quantity || product.qty || 0;
  const isInStock = product.inventory?.is_in_stock || false;

  return {
    // Basic product fields
    id: product.id,
    sku: product.sku,
    name: product.name,
    price,
    status: product.status || 1,
    type_id: product.type_id, // Debug: Don't fallback to see actual values
    qty,
    stock_status: isInStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    // Preserve original inventory field for mesh products
    inventory: product.inventory,
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
