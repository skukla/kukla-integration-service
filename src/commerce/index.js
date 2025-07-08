/**
 * Adobe Commerce integration module
 * @module commerce
 */

/**
 * Commerce Domain Catalog
 * @module commerce
 *
 * Functional composition architecture with hierarchical organization:
 * - utils/: Low-level pure functions (endpoint-builders, request-factories, data-validation, response-processors, oauth, admin-auth)
 * - operations/: Mid-level business processes (authentication, api-requests, data-processing)
 * - workflows/: High-level orchestration (commerce-integration, product-enrichment)
 *
 * Complete Commerce API integration functionality including:
 * - OAuth 1.0 authentication and request handling
 * - Commerce API requests with proper authentication
 * - Endpoint building and URL construction
 * - Data validation, processing, and enrichment
 * - Complete integration workflows
 */

// Import functional composition modules
const apiRequests = require('./operations/api-requests');
const authentication = require('./operations/authentication');
const dataProcessing = require('./operations/data-processing');
const adminAuth = require('./utils/admin-auth');
const dataValidation = require('./utils/data-validation');
const endpointBuilders = require('./utils/endpoint-builders');
const oauth = require('./utils/oauth');
const requestFactories = require('./utils/request-factories');
const responseProcessors = require('./utils/response-processors');
const commerceIntegration = require('./workflows/commerce-integration');
const productEnrichment = require('./workflows/product-enrichment');

module.exports = {
  // === FLAT EXPORTS FOR BACKWARD COMPATIBILITY ===

  // Authentication functions
  createOAuthHeader: oauth.createOAuthHeader,
  getAuthToken: adminAuth.getAuthToken,
  validateOAuthCredentials: authentication.validateOAuthCredentials,
  extractOAuthCredentials: oauth.extractOAuthCredentials,
  extractAdminCredentials: adminAuth.extractAdminCredentials,
  validateAdminCredentials: adminAuth.validateAdminCredentials,
  retryWithAuthHandling: authentication.retryWithAuthHandling,
  createAuthenticationContext: authentication.createAuthenticationContext,

  // API request functions
  executeCommerceRequest: apiRequests.executeCommerceRequest,
  executeBatchCommerceRequests: apiRequests.executeBatchCommerceRequests,
  executeCachedCommerceRequest: apiRequests.executeCachedCommerceRequest,
  orchestrateProductRequests: apiRequests.orchestrateProductRequests,
  orchestrateInventoryRequests: apiRequests.orchestrateInventoryRequests,
  orchestrateCategoryRequests: apiRequests.orchestrateCategoryRequests,
  orchestrateProductEnrichment: apiRequests.orchestrateProductEnrichment,
  handleApiRequestError: apiRequests.handleApiRequestError,

  // Endpoint building functions
  buildProductsEndpoint: endpointBuilders.buildProductsEndpoint,
  buildStockItemEndpoint: endpointBuilders.buildStockItemEndpoint,
  buildCategoryEndpoint: endpointBuilders.buildCategoryEndpoint,
  buildCategoryListEndpoint: endpointBuilders.buildCategoryListEndpoint,
  buildAdminTokenEndpoint: endpointBuilders.buildAdminTokenEndpoint,
  buildCustomerEndpoint: endpointBuilders.buildCustomerEndpoint,
  buildOrderEndpoint: endpointBuilders.buildOrderEndpoint,
  buildSearchEndpoint: endpointBuilders.buildSearchEndpoint,
  buildGenericEndpoint: endpointBuilders.buildGenericEndpoint,
  getEndpointPaths: endpointBuilders.getEndpointPaths,
  validateEndpoint: endpointBuilders.validateEndpoint,
  normalizeEndpoint: endpointBuilders.normalizeEndpoint,

  // Data validation and processing functions
  validateProducts: dataValidation.validateProducts,
  filterProductFields: dataValidation.filterProductFields,
  normalizeProduct: dataValidation.normalizeProduct,

  // Response processing functions
  processInventoryResponses: responseProcessors.processInventoryResponses,
  processCategoryResponses: responseProcessors.processCategoryResponses,
  enrichProductWithCategories: responseProcessors.enrichProductWithCategories,
  enrichProductWithInventory: responseProcessors.enrichProductWithInventory,

  // Data processing operations
  processProductBatch: dataProcessing.processProductBatch,
  processInventoryData: dataProcessing.processInventoryData,
  processCategoryData: dataProcessing.processCategoryData,
  enrichProductData: dataProcessing.enrichProductData,
  orchestrateDataProcessing: dataProcessing.orchestrateDataProcessing,
  handleDataProcessingError: dataProcessing.handleDataProcessingError,

  // Integration workflows
  executeCommerceIntegration: commerceIntegration.executeCommerceIntegration,
  executeProductListing: commerceIntegration.executeProductListing,
  executeProductExport: commerceIntegration.executeProductExport,
  executeHealthCheck: commerceIntegration.executeHealthCheck,
  handleWorkflowError: commerceIntegration.handleWorkflowError,

  // Product enrichment workflows
  executeProductEnrichment: productEnrichment.executeProductEnrichment,
  executeCategoryEnrichment: productEnrichment.executeCategoryEnrichment,
  executeInventoryEnrichment: productEnrichment.executeInventoryEnrichment,
  executeMediaEnrichment: productEnrichment.executeMediaEnrichment,
  analyzeEnrichmentNeeds: productEnrichment.analyzeEnrichmentNeeds,
  extractCategoryIds: productEnrichment.extractCategoryIds,
  extractProductSkus: productEnrichment.extractProductSkus,

  // Request factory functions
  createCommerceClientConfig: requestFactories.createCommerceClientConfig,
  createRequestFunction: requestFactories.createRequestFunction,
  createBatchRequestFunction: requestFactories.createBatchRequestFunction,
  createCachedRequestFunction: requestFactories.createCachedRequestFunction,
  createAuthenticatedHeaders: requestFactories.createAuthenticatedHeaders,

  // === STRUCTURED EXPORTS FOR ORGANIZED ACCESS ===

  utils: {
    oauth: oauth,
    adminAuth: adminAuth,
    endpoints: endpointBuilders,
    requests: requestFactories,
    validation: dataValidation,
    responses: responseProcessors,
  },

  operations: {
    auth: authentication,
    api: apiRequests,
    data: dataProcessing,
  },

  workflows: {
    integration: commerceIntegration,
    enrichment: productEnrichment,
  },

  // Backward compatibility structured exports
  api: {
    integration: {
      createOAuthHeader: oauth.createOAuthHeader,
      getAuthToken: adminAuth.getAuthToken,
      makeCommerceRequest: apiRequests.executeCommerceRequest,
      batchCommerceRequests: apiRequests.executeBatchCommerceRequests,
    },
    requests: {
      executeCommerceRequest: apiRequests.executeCommerceRequest,
      executeBatchCommerceRequests: apiRequests.executeBatchCommerceRequests,
      orchestrateProductRequests: apiRequests.orchestrateProductRequests,
      orchestrateInventoryRequests: apiRequests.orchestrateInventoryRequests,
      orchestrateCategoryRequests: apiRequests.orchestrateCategoryRequests,
    },
  },

  data: {
    validation: {
      validateProducts: dataValidation.validateProducts,
      filterProductFields: dataValidation.filterProductFields,
      normalizeProduct: dataValidation.normalizeProduct,
    },
    processing: {
      processProductBatch: dataProcessing.processProductBatch,
      processInventoryData: dataProcessing.processInventoryData,
      processCategoryData: dataProcessing.processCategoryData,
      enrichProductData: dataProcessing.enrichProductData,
    },
  },
};
