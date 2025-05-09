module.exports = {
  products: (baseUrl) => `${baseUrl}/rest/V1/products`,
  stockItem: (baseUrl, sku) => `${baseUrl}/rest/V1/stockItems/${encodeURIComponent(sku)}`,
  category: (baseUrl, categoryId) => `${baseUrl}/rest/V1/categories/${categoryId}`,
  adminToken: (baseUrl) => `${baseUrl}/rest/V1/integration/admin/token`,
  // Add more endpoints as needed
}; 