/**
 * Adobe Commerce integration module
 * @module commerce
 */

/**
 * Commerce Domain Catalog
 * @module commerce
 *
 * This catalog exports all Commerce API integration functionality including:
 * - OAuth authentication and admin token generation
 * - Commerce API requests with OAuth 1.0 authentication
 * - Endpoint building and URL construction
 * - Data validation and processing
 * - Product transformation and CSV generation
 *
 * Following functional composition principles - each function is pure
 * with clear input/output contracts.
 *
 * Phase 4: Complete Commerce Domain consolidation
 */

// Import all domain modules
const api = require('./api');
const auth = require('./auth');
const data = require('./data');
const endpoints = require('./endpoints');
const transform = require('./transform');

module.exports = {
  // Authentication functions
  createOAuthHeader: auth.createOAuthHeader,
  getAuthToken: auth.getAuthToken,
  validateOAuthCredentials: auth.validateOAuthCredentials,
  validateAdminCredentials: auth.validateAdminCredentials,
  extractOAuthCredentials: auth.extractOAuthCredentials,
  extractAdminCredentials: auth.extractAdminCredentials,
  // API request functions
  createClient: api.createClient,
  makeCommerceRequest: api.makeCommerceRequest,
  batchCommerceRequests: api.batchCommerceRequests,
  makeCachedCommerceRequest: api.makeCachedCommerceRequest,
  processConcurrently: api.processConcurrently,
  createRequestFunction: api.createRequestFunction,
  createBatchRequestFunction: api.createBatchRequestFunction,
  // Endpoint building functions
  buildProductsEndpoint: endpoints.buildProductsEndpoint,
  buildStockItemEndpoint: endpoints.buildStockItemEndpoint,
  buildCategoryEndpoint: endpoints.buildCategoryEndpoint,
  buildCategoryListEndpoint: endpoints.buildCategoryListEndpoint,
  buildAdminTokenEndpoint: endpoints.buildAdminTokenEndpoint,
  buildCustomerEndpoint: endpoints.buildCustomerEndpoint,
  buildOrderEndpoint: endpoints.buildOrderEndpoint,
  buildSearchEndpoint: endpoints.buildSearchEndpoint,
  buildGenericEndpoint: endpoints.buildGenericEndpoint,
  getEndpointPaths: endpoints.getEndpointPaths,
  validateEndpoint: endpoints.validateEndpoint,
  normalizeEndpoint: endpoints.normalizeEndpoint,
  // Data validation and processing functions
  getProductFields: data.getProductFields,
  getRequestedFields: data.getRequestedFields,
  validateProduct: data.validateProduct,
  validateProducts: data.validateProducts,
  filterProductFields: data.filterProductFields,
  getCategoryIds: data.getCategoryIds,
  validateCategory: data.validateCategory,
  validateInventory: data.validateInventory,
  processInventoryResponse: data.processInventoryResponse,
  processCategoryResponse: data.processCategoryResponse,
  createCategoryMap: data.createCategoryMap,
  enrichProductWithCategories: data.enrichProductWithCategories,
  enrichProductWithInventory: data.enrichProductWithInventory,
  normalizeProduct: data.normalizeProduct,
  // Transform functions
  transformImageEntry: transform.transformImageEntry,
  getPrimaryImageUrl: transform.getPrimaryImageUrl,
  transformImages: transform.transformImages,
  buildProductObject: transform.buildProductObject,
  mapProductToCsvRow: transform.mapProductToCsvRow,
  buildProducts: transform.buildProducts,
  mapProductsToCsvRows: transform.mapProductsToCsvRows,
  extractCustomAttributes: transform.extractCustomAttributes,
  flattenProductAttributes: transform.flattenProductAttributes,
  validateImage: transform.validateImage,
  validateImages: transform.validateImages,
  calculateProductMetrics: transform.calculateProductMetrics,
  // Legacy compatibility - preserve existing structure
  api: {
    createClient: api.createClient,
    makeCommerceRequest: api.makeCommerceRequest,
    batchCommerceRequests: api.batchCommerceRequests,
    integration: {
      createOAuthHeader: auth.createOAuthHeader,
      getAuthToken: auth.getAuthToken,
      makeCommerceRequest: api.makeCommerceRequest,
      batchCommerceRequests: api.batchCommerceRequests,
    },
  },

  data: {
    product: {
      getProductFields: data.getProductFields,
      getRequestedFields: data.getRequestedFields,
      validateProduct: data.validateProduct,
      filterProductFields: data.filterProductFields,
    },
    category: {
      validateCategory: data.validateCategory,
      processCategoryResponse: data.processCategoryResponse,
      createCategoryMap: data.createCategoryMap,
      getCategoryIds: data.getCategoryIds,
    },
    inventory: {
      validateInventory: data.validateInventory,
      processInventoryResponse: data.processInventoryResponse,
    },
  },

  transform: {
    product: {
      buildProductObject: transform.buildProductObject,
      mapProductToCsvRow: transform.mapProductToCsvRow,
      buildProducts: transform.buildProducts,
      mapProductsToCsvRows: transform.mapProductsToCsvRows,
      calculateProductMetrics: transform.calculateProductMetrics,
    },
    images: {
      transformImageEntry: transform.transformImageEntry,
      getPrimaryImageUrl: transform.getPrimaryImageUrl,
      transformImages: transform.transformImages,
      validateImage: transform.validateImage,
      validateImages: transform.validateImages,
    },
  },
};
