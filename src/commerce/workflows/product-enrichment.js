/**
 * Product Enrichment Workflows
 *
 * High-level orchestration functions for specialized product data enrichment workflows.
 * Pure orchestration following DDD patterns - delegates to operations layer.
 */

const {
  orchestrateInventoryRequests,
  orchestrateCategoryRequests,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const {
  processProductBatch,
  enrichProductData,
  analyzeEnrichmentNeeds,
  fetchAdditionalData,
  extractCategoryIds,
  extractProductSkus,
  processMediaEnrichment,
} = require('../operations/data-processing');
const {
  buildProductEnrichmentSuccessResponse,
  buildEmptyProductEnrichmentResponse,
  buildProductEnrichmentErrorResponse,
  buildCategoryEnrichmentSuccessResponse,
  buildEmptyCategoryEnrichmentResponse,
  buildCategoryEnrichmentErrorResponse,
  buildInventoryEnrichmentSuccessResponse,
  buildEmptyInventoryEnrichmentResponse,
  buildInventoryEnrichmentErrorResponse,
  buildMediaEnrichmentSuccessResponse,
  buildMediaEnrichmentErrorResponse,
} = require('../operations/response-building');
const {
  validateProductEnrichmentParams,
  createValidationErrorResponse,
} = require('../operations/validation');

/**
 * Executes a comprehensive product enrichment workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} params - Enrichment parameters
 * @param {Array<Object>} params.products - Base product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @param {Object} [params.options] - Enrichment options
 * @returns {Promise<Object>} Enriched product data
 */
async function executeProductEnrichment(params) {
  const { products, config, actionParams, trace, options = {} } = params;

  try {
    // Step 1: Validate parameters
    const validationError = validateProductEnrichmentParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'product-enrichment');
    }

    // Step 2: Process base product data
    const processedProducts = processProductBatch(products, config, options);

    if (!processedProducts.products.length) {
      return buildEmptyProductEnrichmentResponse();
    }

    // Step 3: Analyze enrichment requirements
    const enrichmentNeeds = analyzeEnrichmentNeeds(processedProducts.products, options);

    // Step 4: Fetch additional data in parallel
    const additionalData = await fetchAdditionalData(enrichmentNeeds, config, actionParams, trace);

    // Step 5: Apply enrichment
    const enrichmentResult = enrichProductData(
      processedProducts.products,
      additionalData.categoryMap,
      additionalData.inventoryMap,
      options
    );

    // Step 6: Build success response
    return buildProductEnrichmentSuccessResponse(
      enrichmentResult,
      processedProducts.validation,
      additionalData
    );
  } catch (error) {
    // Step 7: Build error response
    return buildProductEnrichmentErrorResponse(error);
  }
}

/**
 * Executes a category-focused enrichment workflow
 * Pure orchestration that delegates to operations layer.
 *
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
    // Step 1: Extract category IDs from products
    const categoryIds = extractCategoryIds(products);

    if (!categoryIds.length) {
      return buildEmptyCategoryEnrichmentResponse(products);
    }

    // Step 2: Fetch category data
    const categoryResponses = await retryWithAuthHandling(
      () => orchestrateCategoryRequests(categoryIds, config, actionParams, trace),
      { maxRetries: 2 }
    );

    // Step 3: Process category data
    const categoryData = require('../operations/data-processing').orchestrateDataProcessing(
      { categories: categoryResponses },
      config,
      { validate: false }
    );

    // Step 4: Apply category enrichment
    const enrichmentResult = enrichProductData(
      products,
      categoryData.processing.categoryProcessing || {},
      {},
      { includeCategories: true, includeInventory: false }
    );

    // Step 5: Build success response
    const categoryStats = {
      totalCategories: categoryIds.length,
      productsEnriched: enrichmentResult.enrichmentStats.categoriesEnriched,
    };

    return buildCategoryEnrichmentSuccessResponse(enrichmentResult.enrichedProducts, categoryStats);
  } catch (error) {
    // Step 6: Build error response
    return buildCategoryEnrichmentErrorResponse(error);
  }
}

/**
 * Executes an inventory-focused enrichment workflow
 * Pure orchestration that delegates to operations layer.
 *
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
    // Step 1: Extract SKUs from products
    const skus = extractProductSkus(products);

    if (!skus.length) {
      return buildEmptyInventoryEnrichmentResponse(products);
    }

    // Step 2: Fetch inventory data
    const inventoryResponses = await retryWithAuthHandling(
      () => orchestrateInventoryRequests(skus, config, actionParams, trace),
      { maxRetries: 2 }
    );

    // Step 3: Process inventory data
    const inventoryData = require('../operations/data-processing').orchestrateDataProcessing(
      { inventory: inventoryResponses },
      config,
      { validate: false }
    );

    // Step 4: Apply inventory enrichment
    const enrichmentResult = enrichProductData(
      products,
      {},
      inventoryData.processing.inventoryProcessing || {},
      { includeCategories: false, includeInventory: true }
    );

    // Step 5: Build success response
    const inventoryStats = {
      totalSkus: skus.length,
      productsEnriched: enrichmentResult.enrichmentStats.inventoryEnriched,
    };

    return buildInventoryEnrichmentSuccessResponse(
      enrichmentResult.enrichedProducts,
      inventoryStats
    );
  } catch (error) {
    // Step 6: Build error response
    return buildInventoryEnrichmentErrorResponse(error);
  }
}

/**
 * Executes a media/image enrichment workflow
 * Pure orchestration that delegates to operations layer.
 *
 * @param {Object} params - Media enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @returns {Promise<Object>} Media-enriched product data
 */
async function executeMediaEnrichment(params) {
  const { products, config } = params;

  try {
    // Step 1: Process media enrichment
    const mediaResult = processMediaEnrichment(products, config);

    // Step 2: Build success response
    return buildMediaEnrichmentSuccessResponse(
      mediaResult.enrichedProducts,
      mediaResult.mediaStats
    );
  } catch (error) {
    // Step 3: Build error response
    return buildMediaEnrichmentErrorResponse(error);
  }
}

module.exports = {
  executeProductEnrichment,
  executeCategoryEnrichment,
  executeInventoryEnrichment,
  executeMediaEnrichment,
};
