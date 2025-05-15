const { fetchAllProducts, resolveToken, enrichWithInventory, buildCategoryMap } = require('../productHelpers');

module.exports = async function fetchAndEnrichProducts(params, logger) {
  const token = await resolveToken(params, logger);
  const products = await fetchAllProducts(token, params);
  const productsWithInventory = await enrichWithInventory(products, token, params);
  const categoryMap = await buildCategoryMap(productsWithInventory, token, params);
  return { token, products, productsWithInventory, categoryMap };
}; 