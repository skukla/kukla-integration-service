/**
 * Commerce Product Enrichment Workflows
 *
 * Product data enrichment workflows for Commerce integration
 */

const {
  orchestrateInventoryRequests,
  orchestrateCategoryRequests,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const {
  transformProductBatch,
  enrichProductsWithData,
  extractCategoryIds,
  extractProductSkus,
  transformMediaEntries,
} = require('../operations/data-transformation');
const {
  buildSuccessResponse,
  buildErrorResponse,
  buildEmptyResponse,
} = require('../operations/response-building');
const {
  validateProductEnrichmentParams,
  createValidationErrorResponse,
} = require('../operations/validation');

// === ENRICHMENT WORKFLOWS ===

/**
 * Comprehensive product enrichment workflow
 * @param {Object} params - Enrichment parameters
 * @param {Array<Object>} params.products - Base product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Enriched product data
 */
async function executeProductEnrichment(params) {
  const { products, config, actionParams, trace } = params;

  try {
    const validationError = validateProductEnrichmentParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'product-enrichment');
    }

    const processedProducts = transformProductBatch(products, config);
    if (!processedProducts.products.length) {
      return buildEmptyResponse('No products found to enrich');
    }

    const additionalData = await fetchEnrichmentData(
      processedProducts.products,
      config,
      actionParams,
      trace
    );

    const enrichmentResult = enrichProductsWithData(
      processedProducts.products,
      additionalData.categoryMap,
      additionalData.inventoryMap
    );

    return buildSuccessResponse(
      {
        enrichedProducts: enrichmentResult.enrichedProducts,
        enrichmentStats: enrichmentResult.enrichmentStats,
        validation: processedProducts.validation,
      },
      'Products enriched successfully'
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}

/**
 * Category-focused enrichment workflow
 * @param {Object} params - Category enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Category-enriched product data
 */
async function executeCategoryEnrichment(params) {
  const { products, config, actionParams, trace } = params;

  try {
    const categoryIds = extractCategoryIds(products);
    if (!categoryIds.length) {
      return buildEmptyResponse('No categories found to enrich', { products });
    }

    const categoryResponses = await retryWithAuthHandling(
      () => orchestrateCategoryRequests(categoryIds, config, actionParams, trace),
      { maxRetries: 2 }
    );

    const categoryMap = categoryResponses.reduce((map, cat) => {
      if (cat.id) map[cat.id] = cat;
      return map;
    }, {});

    const enrichmentResult = enrichProductsWithData(products, categoryMap, {});

    return buildSuccessResponse(
      {
        enrichedProducts: enrichmentResult.enrichedProducts,
        categoryStats: {
          totalCategories: categoryIds.length,
          productsEnriched: enrichmentResult.enrichmentStats.categoriesAdded,
        },
      },
      'Categories enriched successfully'
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}

/**
 * Inventory-focused enrichment workflow
 * @param {Object} params - Inventory enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Inventory-enriched product data
 */
async function executeInventoryEnrichment(params) {
  const { products, config, actionParams, trace } = params;

  try {
    const skus = extractProductSkus(products);
    if (!skus.length) {
      return buildEmptyResponse('No SKUs found to enrich', { products });
    }

    const inventoryResponses = await retryWithAuthHandling(
      () => orchestrateInventoryRequests(skus, config, actionParams, trace),
      { maxRetries: 2 }
    );

    const inventoryMap = inventoryResponses.reduce((map, inv) => {
      if (inv.product_id || inv.sku) map[inv.product_id || inv.sku] = inv;
      return map;
    }, {});

    const enrichmentResult = enrichProductsWithData(products, {}, inventoryMap);

    return buildSuccessResponse(
      {
        enrichedProducts: enrichmentResult.enrichedProducts,
        inventoryStats: {
          totalSkus: skus.length,
          productsEnriched: enrichmentResult.enrichmentStats.inventoryAdded,
        },
      },
      'Inventory enriched successfully'
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}

/**
 * Media/image enrichment workflow
 * @param {Object} params - Media enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @returns {Promise<Object>} Media-enriched product data
 */
async function executeMediaEnrichment(params) {
  const { products, config } = params;

  try {
    let mediaEnriched = 0;
    const enrichedProducts = products.map((product) => {
      if (product.media_gallery_entries && Array.isArray(product.media_gallery_entries)) {
        const processedMedia = transformMediaEntries(product.media_gallery_entries, config);
        if (processedMedia.length > 0) {
          mediaEnriched++;
        }
        return {
          ...product,
          media_gallery_entries: processedMedia,
          images: processedMedia.filter((media) => media.url),
        };
      }
      return product;
    });

    return buildSuccessResponse(
      {
        enrichedProducts,
        mediaStats: {
          totalProducts: products.length,
          productsEnriched: mediaEnriched,
        },
      },
      'Media enriched successfully'
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// === UTILITY FUNCTIONS ===

/**
 * Fetch enrichment data (categories and inventory) in parallel
 * @param {Array<Object>} products - Product data
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Additional data maps
 */
async function fetchEnrichmentData(products, config, actionParams, trace) {
  const additionalData = { categoryMap: {}, inventoryMap: {} };

  const categoryIds = extractCategoryIds(products);
  const productSkus = extractProductSkus(products);

  if (categoryIds.length > 0) {
    try {
      const categories = await orchestrateCategoryRequests(
        categoryIds,
        config,
        actionParams,
        trace
      );
      additionalData.categoryMap = categories.reduce((map, cat) => {
        if (cat.id) map[cat.id] = cat;
        return map;
      }, {});
    } catch (error) {
      console.warn('Failed to fetch categories:', error.message);
    }
  }

  if (productSkus.length > 0) {
    try {
      const inventory = await orchestrateInventoryRequests(
        productSkus,
        config,
        actionParams,
        trace
      );
      additionalData.inventoryMap = inventory.reduce((map, inv) => {
        if (inv.product_id || inv.sku) map[inv.product_id || inv.sku] = inv;
        return map;
      }, {});
    } catch (error) {
      console.warn('Failed to fetch inventory:', error.message);
    }
  }

  return additionalData;
}

module.exports = {
  // Main enrichment workflows
  executeProductEnrichment,
  executeCategoryEnrichment,
  executeInventoryEnrichment,
  executeMediaEnrichment,

  // Utility functions
  fetchEnrichmentData,
};
