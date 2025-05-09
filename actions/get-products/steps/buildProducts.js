const { buildProductObject } = require('../productHelpers');

const requestedFields = ['sku', 'name', 'price', 'qty', 'categories', 'images'];

module.exports = function buildProducts(productsWithInventory, categoryMap) {
  return productsWithInventory.map(product =>
    buildProductObject(product, requestedFields, categoryMap)
  );
}; 