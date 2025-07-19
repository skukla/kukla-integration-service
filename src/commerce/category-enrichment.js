/**
 * Commerce Category Enrichment - Feature Core
 * Complete category enrichment capability - Feature Core with Sub-modules
 */

// Import from feature sub-modules (same domain)
const { fetchCategoryDataWithBatching } = require('./category-enrichment/batch-processing');
const {
  applyCategoriesToProducts,
  extractUniqueCategoryIds,
} = require('./category-enrichment/data-extraction');
const { validateAndApplyFallbacks } = require('./category-enrichment/data-validation');

// Business Workflows

/**
 * Complete category enrichment workflow with intelligent batching
 * @purpose Execute comprehensive category enrichment pipeline with batch processing, error handling, and data validation
 * @param {Array} products - Array of product objects to enrich with category data
 * @param {Object} config - Complete configuration object with Commerce API settings and batching preferences
 * @param {Object} params - Action parameters containing admin credentials for Commerce API
 * @param {Object} [trace=null] - Optional trace context for API call tracking and performance monitoring
 * @param {Object} [options={}] - Enrichment options including fallback strategies and processing preferences
 * @returns {Promise<Array>} Array of products enriched with complete category information
 * @throws {Error} When critical category fetching failures occur or validation errors prevent processing
 * @usedBy exportProducts in rest-export.js, fetchAndEnrichProducts in product-fetching.js, mesh export workflows
 */
async function enrichProductsWithCategoriesAndFallback(
  products,
  config,
  params,
  trace = null,
  options = {}
) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Extract and validate category IDs from all products
    const categoryIds = extractUniqueCategoryIds(products);
    if (categoryIds.size === 0) {
      return products; // No categories to enrich
    }

    // Step 2: Fetch category data with intelligent batching
    const categoryMap = await fetchCategoryDataWithBatching(
      categoryIds,
      config,
      params,
      trace,
      options
    );

    // Step 3: Validate and apply fallback strategies
    const enhancedCategoryMap = validateAndApplyFallbacks(categoryMap, options);

    // Step 4: Apply category data to products
    const enrichedProducts = await applyCategoriesToProducts(products, enhancedCategoryMap);

    return enrichedProducts;
  } catch (error) {
    console.warn(`Category enrichment failed: ${error.message}`);
    if (options.throwOnError) {
      throw error;
    }
    return products; // Return products without enrichment as fallback
  }
}

/**
 * Category enrichment without advanced fallback handling
 * @purpose Basic category enrichment workflow for lightweight use cases
 * @param {Array} products - Array of product objects to enrich
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @param {Object} [trace=null] - Optional trace context
 * @returns {Promise<Array>} Products enriched with category data
 * @usedBy Basic category enrichment workflows
 */
async function enrichProductsWithCategories(products, config, params, trace = null) {
  return await enrichProductsWithCategoriesAndFallback(products, config, params, trace, {
    fallbackStrategy: 'basic',
    throwOnError: false,
  });
}

/**
 * Fetch category data for external use (API endpoint)
 * @purpose Provide category data to external systems and integrations
 * @param {Set|Array} categoryIds - Category IDs to fetch
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters with credentials
 * @param {Object} [trace=null] - Optional trace context
 * @returns {Promise<Object>} Map of category data for external consumption
 * @usedBy External API endpoints, integrations
 */
async function fetchCategoryDataForExternalUse(categoryIds, config, params, trace = null) {
  const categorySet = categoryIds instanceof Set ? categoryIds : new Set(categoryIds);

  return await fetchCategoryDataWithBatching(categorySet, config, params, trace, {
    externalUse: true,
    includeMetadata: true,
  });
}

module.exports = {
  // Business workflows
  enrichProductsWithCategoriesAndFallback,
  enrichProductsWithCategories,
  fetchCategoryDataForExternalUse,

  // Feature operations
  fetchCategoryDataWithBatching,
  applyCategoriesToProducts,
  validateAndApplyFallbacks,

  // Feature utilities
  extractUniqueCategoryIds,
};
