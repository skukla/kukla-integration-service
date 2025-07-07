/**
 * Products Domain Catalog
 *
 * This catalog will export all product-related functionality including:
 * - Product fetching and enrichment
 * - Data transformation and CSV generation
 * - Product validation
 *
 * Following functional composition principles - each function will be pure
 * with clear input/output contracts.
 *
 * To be populated in Phase 2 with functions moved from:
 * - actions/backend/get-products/steps/
 * - actions/backend/get-products/lib/api/
 * - src/commerce/transform/product.js
 * - src/commerce/data/product.js
 */

module.exports = {
  // Fetch operations
  fetchProducts: require('./fetch').fetchProducts,
  enrichWithCategories: require('./fetch').enrichWithCategories,
  enrichWithInventory: require('./fetch').enrichWithInventory,
  fetchAndEnrichProducts: require('./fetch').fetchAndEnrichProducts,

  // Transform operations
  buildProductObject: require('./transform').buildProductObject,
  mapProductToCsvRow: require('./transform').mapProductToCsvRow,
  buildProducts: require('./transform').buildProducts,
  createCsv: require('./transform').createCsv,
  buildProductCsv: require('./transform').buildProductCsv,

  // Validation operations
  validateInput: require('./validate').validateInput,
  validateProduct: require('./validate').validateProduct,
  validateProductData: require('./validate').validateProductData,
  validateProductConfig: require('./validate').validateProductConfig,
  getProductFields: require('./validate').getProductFields,
  getRequestedFields: require('./validate').getRequestedFields,
};
