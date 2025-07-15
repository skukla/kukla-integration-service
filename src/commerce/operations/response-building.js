/**
 * Commerce Response Building Operations
 *
 * Mid-level business logic for building standardized commerce workflow responses.
 * Contains operations that construct consistent response formats across all commerce operations.
 */

const { handleApiRequestError } = require('./api-requests');

/**
 * Build commerce integration success response
 * Business operation that constructs standardized success response for commerce integration.
 *
 * @param {Object} processingResult - Result from data processing operation
 * @returns {Object} Standardized integration success response
 */
function buildCommerceIntegrationSuccessResponse(processingResult) {
  return {
    success: true,
    data: processingResult,
    metadata: {
      timestamp: new Date().toISOString(),
      totalProducts: processingResult.products ? processingResult.products.length : 0,
      processingStats: processingResult.processing || {},
    },
  };
}

/**
 * Build commerce integration error response
 * Business operation that constructs standardized error response for commerce integration.
 *
 * @param {Error} error - Error that occurred during integration
 * @param {Object} context - Context information for error enhancement
 * @param {string} context.workflow - Name of the workflow that failed
 * @param {string} [context.query] - Query parameters that caused the error
 * @returns {Object} Standardized integration error response
 */
function buildCommerceIntegrationErrorResponse(error, context = {}) {
  const { workflow = 'commerce-integration', query } = context;

  // Enhanced error handling with context
  const enhancedError = handleApiRequestError(error, {
    workflow,
    query: query ? JSON.stringify(query) : undefined,
  });

  return {
    success: false,
    error: enhancedError,
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: workflow,
    },
  };
}

/**
 * Build product enrichment success response
 * Business operation that constructs standardized success response for product enrichment.
 *
 * @param {Object} enrichmentResult - Result from product enrichment operation
 * @param {Object} validation - Validation result from processing
 * @param {Object} additionalData - Additional data fetched during enrichment
 * @returns {Object} Standardized enrichment success response
 */
function buildProductEnrichmentSuccessResponse(enrichmentResult, validation, additionalData) {
  return {
    success: true,
    enrichedProducts: enrichmentResult.enrichedProducts,
    enrichmentStats: enrichmentResult.enrichmentStats,
    validation,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'product-enrichment',
      dataFetched: {
        categories: additionalData.categoryMap ? Object.keys(additionalData.categoryMap).length : 0,
        inventory: additionalData.inventoryMap
          ? Object.keys(additionalData.inventoryMap).length
          : 0,
      },
    },
  };
}

/**
 * Build empty product enrichment response
 * Business operation that constructs response when no products are found for enrichment.
 *
 * @returns {Object} Standardized empty enrichment response
 */
function buildEmptyProductEnrichmentResponse() {
  return {
    success: true,
    enrichedProducts: [],
    enrichmentStats: {
      totalProducts: 0,
      categoriesEnriched: 0,
      inventoryEnriched: 0,
      mediaEnriched: 0,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'product-enrichment',
    },
  };
}

/**
 * Build product enrichment error response
 * Business operation that constructs standardized error response for product enrichment.
 *
 * @param {Error} error - Error that occurred during enrichment
 * @param {Object} context - Context information for error enhancement
 * @returns {Object} Standardized enrichment error response
 */
function buildProductEnrichmentErrorResponse(error, context = {}) {
  const enhancedError = handleApiRequestError(error, {
    workflow: 'product-enrichment',
    ...context,
  });

  return {
    success: false,
    error: enhancedError,
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: 'product-enrichment',
    },
  };
}

/**
 * Build product listing success response
 * Business operation that constructs standardized success response for product listing.
 *
 * @param {Object} listingResult - Result from product listing operation
 * @returns {Object} Standardized listing success response
 */
function buildProductListingSuccessResponse(listingResult) {
  return {
    success: true,
    data: listingResult,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'product-listing',
      totalProducts: listingResult.products ? listingResult.products.length : 0,
    },
  };
}

/**
 * Build product listing error response
 * Business operation that constructs standardized error response for product listing.
 *
 * @param {Error} error - Error that occurred during listing
 * @param {Object} context - Context information for error enhancement
 * @returns {Object} Standardized listing error response
 */
function buildProductListingErrorResponse(error, context = {}) {
  const enhancedError = handleApiRequestError(error, {
    workflow: 'product-listing',
    ...context,
  });

  return {
    success: false,
    error: enhancedError,
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: 'product-listing',
    },
  };
}

/**
 * Build health check success response
 * Business operation that constructs standardized success response for health checks.
 *
 * @param {Object} healthResult - Result from health check operation
 * @returns {Object} Standardized health check success response
 */
function buildHealthCheckSuccessResponse(healthResult) {
  return {
    success: true,
    data: healthResult,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'health-check',
    },
  };
}

/**
 * Build health check error response
 * Business operation that constructs standardized error response for health checks.
 *
 * @param {Error} error - Error that occurred during health check
 * @param {Object} context - Context information for error enhancement
 * @returns {Object} Standardized health check error response
 */
function buildHealthCheckErrorResponse(error, context = {}) {
  const enhancedError = handleApiRequestError(error, {
    workflow: 'health-check',
    ...context,
  });

  return {
    success: false,
    error: enhancedError,
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: 'health-check',
    },
  };
}

/**
 * Build export success response
 * Business operation that constructs standardized success response for export operations.
 *
 * @param {Object} exportResult - Result from export operation
 * @returns {Object} Standardized export success response
 */
function buildExportSuccessResponse(exportResult) {
  return {
    success: true,
    data: exportResult,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'product-export',
      totalProducts: exportResult.products ? exportResult.products.length : 0,
      exportStats: exportResult.exportStats || {},
    },
  };
}

/**
 * Build export error response
 * Business operation that constructs standardized error response for export operations.
 *
 * @param {Error} error - Error that occurred during export
 * @param {Object} context - Context information for error enhancement
 * @returns {Object} Standardized export error response
 */
function buildExportErrorResponse(error, context = {}) {
  const enhancedError = handleApiRequestError(error, {
    workflow: 'product-export',
    ...context,
  });

  return {
    success: false,
    error: enhancedError,
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: 'product-export',
    },
  };
}

/**
 * Builds success response for category enrichment
 * @param {Array<Object>} enrichedProducts - Enriched product data
 * @param {Object} categoryStats - Category enrichment statistics
 * @returns {Object} Category enrichment success response
 */
function buildCategoryEnrichmentSuccessResponse(enrichedProducts, categoryStats) {
  return {
    success: true,
    enrichedProducts,
    categoryStats,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'category-enrichment',
    },
  };
}

/**
 * Builds empty response for category enrichment (no categories found)
 * @param {Array<Object>} products - Original product data
 * @returns {Object} Empty category enrichment response
 */
function buildEmptyCategoryEnrichmentResponse(products) {
  return {
    success: true,
    enrichedProducts: products,
    categoryStats: {
      totalCategories: 0,
      productsEnriched: 0,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'category-enrichment',
    },
  };
}

/**
 * Builds error response for category enrichment
 * @param {Error} error - Error object
 * @returns {Object} Category enrichment error response
 */
function buildCategoryEnrichmentErrorResponse(error) {
  return {
    success: false,
    error: {
      message: error.message,
      workflow: 'category-enrichment',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Builds success response for inventory enrichment
 * @param {Array<Object>} enrichedProducts - Enriched product data
 * @param {Object} inventoryStats - Inventory enrichment statistics
 * @returns {Object} Inventory enrichment success response
 */
function buildInventoryEnrichmentSuccessResponse(enrichedProducts, inventoryStats) {
  return {
    success: true,
    enrichedProducts,
    inventoryStats,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'inventory-enrichment',
    },
  };
}

/**
 * Builds empty response for inventory enrichment (no SKUs found)
 * @param {Array<Object>} products - Original product data
 * @returns {Object} Empty inventory enrichment response
 */
function buildEmptyInventoryEnrichmentResponse(products) {
  return {
    success: true,
    enrichedProducts: products,
    inventoryStats: {
      totalSkus: 0,
      productsEnriched: 0,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'inventory-enrichment',
    },
  };
}

/**
 * Builds error response for inventory enrichment
 * @param {Error} error - Error object
 * @returns {Object} Inventory enrichment error response
 */
function buildInventoryEnrichmentErrorResponse(error) {
  return {
    success: false,
    error: {
      message: error.message,
      workflow: 'inventory-enrichment',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Builds success response for media enrichment
 * @param {Array<Object>} enrichedProducts - Enriched product data
 * @param {Object} mediaStats - Media enrichment statistics
 * @returns {Object} Media enrichment success response
 */
function buildMediaEnrichmentSuccessResponse(enrichedProducts, mediaStats) {
  return {
    success: true,
    enrichedProducts,
    mediaStats,
    metadata: {
      timestamp: new Date().toISOString(),
      workflow: 'media-enrichment',
    },
  };
}

/**
 * Builds error response for media enrichment
 * @param {Error} error - Error object
 * @returns {Object} Media enrichment error response
 */
function buildMediaEnrichmentErrorResponse(error) {
  return {
    success: false,
    error: {
      message: error.message,
      workflow: 'media-enrichment',
      timestamp: new Date().toISOString(),
    },
  };
}

module.exports = {
  buildCommerceIntegrationSuccessResponse,
  buildCommerceIntegrationErrorResponse,
  buildProductEnrichmentSuccessResponse,
  buildEmptyProductEnrichmentResponse,
  buildProductEnrichmentErrorResponse,
  buildProductListingSuccessResponse,
  buildProductListingErrorResponse,
  buildHealthCheckSuccessResponse,
  buildHealthCheckErrorResponse,
  buildExportSuccessResponse,
  buildExportErrorResponse,
  buildCategoryEnrichmentSuccessResponse,
  buildEmptyCategoryEnrichmentResponse,
  buildCategoryEnrichmentErrorResponse,
  buildInventoryEnrichmentSuccessResponse,
  buildEmptyInventoryEnrichmentResponse,
  buildInventoryEnrichmentErrorResponse,
  buildMediaEnrichmentSuccessResponse,
  buildMediaEnrichmentErrorResponse,
};
