const REST_V1_PATH = '/rest/V1';

module.exports = {
  products: (baseUrl) => `${baseUrl}${REST_V1_PATH}/products`,
  stockItem: (baseUrl, sku) => `${baseUrl}${REST_V1_PATH}/stockItems/${encodeURIComponent(sku)}`,
  category: (baseUrl, categoryId) => `${baseUrl}${REST_V1_PATH}/categories/${categoryId}`,
  adminToken: (baseUrl) => `${baseUrl}${REST_V1_PATH}/integration/admin/token`,
  // Add more endpoints as needed
}; 