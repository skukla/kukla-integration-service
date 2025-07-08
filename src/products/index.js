/**
 * Products Domain Catalog
 *
 * Hierarchical organization of products domain functionality.
 * Provides discoverability at multiple abstraction levels.
 */

// High-level workflows (what users actually want to do)
// Mid-level operations (how the domain works)
const {
  fetchProducts,
  enrichWithCategories,
  enrichWithInventory,
  fetchAndEnrichProducts,
} = require('./operations/enrichment');
const {
  buildProducts,
  buildProductObject,
  mapProductToCsvRow,
  PRODUCT_FIELDS,
} = require('./operations/transformation');
const { validateInput, validateMeshInput } = require('./operations/validation');
// Low-level utilities (implementation details)
const { extractCategoryIds, extractProductSkus } = require('./utils/category');
const {
  createCsv,
  validateCsvHeaders,
  formatCsvWithRecsHeaders,
  RECS_HEADERS,
  CSV_HEADERS,
} = require('./utils/csv');
const {
  getCategoryIds,
  extractCsvCategoryId,
  extractProductMessage,
  normalizeProductValue,
  normalizeProductInventory,
} = require('./utils/data');
const { transformImageEntry, getPrimaryImageUrl } = require('./utils/image');
const {
  validateProduct,
  validateProductData,
  validateProductConfig,
  getProductFields,
  getRequestedFields,
} = require('./utils/validation');
const {
  exportProducts,
  exportProductsWithStorage,
  buildProductCsv,
} = require('./workflows/export-products');

// Main exports - flat access for compatibility
module.exports = {
  // High-level workflows
  exportProducts,
  exportProductsWithStorage,
  buildProductCsv,
  // Core operations
  fetchProducts,
  enrichWithCategories,
  enrichWithInventory,
  fetchAndEnrichProducts,
  buildProducts,
  buildProductObject,
  mapProductToCsvRow,
  // CSV operations
  createCsv,
  validateCsvHeaders,
  formatCsvWithRecsHeaders,
  // Validation
  validateInput,
  validateMeshInput,
  validateProduct,
  validateProductData,
  validateProductConfig,
  getProductFields,
  getRequestedFields,
  // Utility functions
  transformImageEntry,
  getPrimaryImageUrl,
  getCategoryIds,
  extractCsvCategoryId,
  extractProductMessage,
  normalizeProductValue,
  normalizeProductInventory,
  extractCategoryIds,
  extractProductSkus,
  // Constants
  PRODUCT_FIELDS,
  RECS_HEADERS,
  CSV_HEADERS,

  // Structured access for organized usage
  workflows: {
    export: require('./workflows/export-products'),
  },

  operations: {
    enrichment: require('./operations/enrichment'),
    transformation: require('./operations/transformation'),
    validation: require('./operations/validation'),
  },

  utils: {
    csv: require('./utils/csv'),
    image: require('./utils/image'),
    data: require('./utils/data'),
    category: require('./utils/category'),
    validation: require('./utils/validation'),
  },
};
