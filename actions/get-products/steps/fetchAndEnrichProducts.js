const { fetchAllProducts, resolveToken, enrichWithInventory, buildCategoryMap, getMagentoConfig } = require('../productHelpers');

module.exports = async function fetchAndEnrichProducts(params, logger) {
  const magentoConfig = getMagentoConfig(params);
  const token = await resolveToken(params, logger, magentoConfig);
  const products = await fetchAllProducts(token, magentoConfig);
  const productsWithInventory = await enrichWithInventory(products, token, magentoConfig);
  const categoryMap = await buildCategoryMap(productsWithInventory, token, magentoConfig);
  return { token, products, productsWithInventory, categoryMap };
}; 