/**
 * Commerce Data Processing Operations
 *
 * High-level orchestration for Commerce data processing workflows.
 * Coordinates data transformation operations without doing processing itself.
 * Pure processing functions moved to data-transformation.js for separation of concerns.
 */

const {
  transformProductBatch,
  transformInventoryData,
  transformCategoryData,
  enrichProductsWithData,
} = require('./data-transformation');

/**
 * Orchestrates complete data processing workflow
 * High-level coordination function that delegates processing to transformation operations.
 *
 * @param {Object} rawData - Raw data from multiple sources
 * @param {Object} config - Configuration object
 * @param {Object} options - Processing options
 * @returns {Object} Processed and enriched data with comprehensive stats
 */
function orchestrateDataProcessing(rawData, config, options = {}) {
  const {
    products: rawProducts = [],
    categories: rawCategories = [],
    inventory: rawInventory = [],
  } = rawData;

  // Step 1: Transform product batch
  const productResult = transformProductBatch(rawProducts, config, options);

  // Step 2: Transform category data
  const categoryResult = transformCategoryData(rawCategories, productResult.products);

  // Step 3: Transform inventory data
  const inventoryResult = transformInventoryData(rawInventory, productResult.products);

  // Step 4: Enrich products with transformed data
  const enrichmentResult = enrichProductsWithData(
    productResult.products,
    categoryResult.categoryMap,
    inventoryResult.inventoryMap,
    options
  );

  return {
    products: enrichmentResult.enrichedProducts,
    processing: {
      productValidation: productResult.validation,
      categoryProcessing: {
        totalCategories: Object.keys(categoryResult.categoryMap).length,
        productsWithCategories: categoryResult.processedCount,
      },
      inventoryProcessing: {
        totalInventoryItems: Object.keys(inventoryResult.inventoryMap).length,
        productsWithInventory: inventoryResult.processedCount,
      },
      enrichmentStats: enrichmentResult.enrichmentStats,
    },
  };
}

/**
 * Handles data processing errors with enhanced context
 * Orchestration function for comprehensive error handling and recovery.
 *
 * @param {Error} error - Processing error
 * @param {Object} context - Processing context and state
 * @returns {Object} Enhanced error information with recovery suggestions
 */
function handleDataProcessingError(error, context = {}) {
  const { step = 'unknown', productsCount = 0, categoriesCount = 0, inventoryCount = 0 } = context;

  return {
    error: {
      message: error.message,
      name: error.name,
      step,
      stack: error.stack,
    },
    context: {
      processingStep: step,
      dataStats: {
        products: productsCount,
        categories: categoriesCount,
        inventory: inventoryCount,
      },
    },
    recovery: {
      suggestions: generateRecoverySuggestions(error, context),
      retryable: isRetryableError(error),
    },
  };
}

/**
 * Validates processing workflow configuration
 * Orchestration function for pre-processing validation.
 *
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation results
 */
function validateProcessingWorkflow(config) {
  const errors = [];
  const warnings = [];

  // Validate required configuration
  if (!config.commerce?.baseUrl) {
    errors.push('Commerce base URL is required');
  }

  if (!config.commerce?.credentials) {
    errors.push('Commerce credentials are required');
  }

  // Validate endpoint configuration
  if (!config.commerce?.endpoints?.categories) {
    warnings.push('Category endpoint not configured - categories will be skipped');
  }

  if (!config.commerce?.endpoints?.inventory) {
    warnings.push('Inventory endpoint not configured - inventory will be skipped');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      hasRequiredConfig: errors.length === 0,
      hasOptionalConfig: warnings.length === 0,
    },
  };
}

/**
 * Helper function to generate error recovery suggestions
 * @param {Error} error - The error object
 * @param {Object} context - Error context
 * @returns {Array<string>} Recovery suggestions
 */
function generateRecoverySuggestions(error, context) {
  const suggestions = [];

  if (error.message.includes('network') || error.message.includes('timeout')) {
    suggestions.push('Check network connectivity and retry');
    suggestions.push('Consider increasing timeout values');
  }

  if (error.message.includes('validation')) {
    suggestions.push('Verify data format and required fields');
    suggestions.push('Check configuration validation rules');
  }

  if (context.step === 'product-processing' && context.productsCount === 0) {
    suggestions.push('Verify product data source and format');
  }

  return suggestions.length > 0 ? suggestions : ['Review error details and data inputs'];
}

/**
 * Helper function to determine if error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(error) {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /temporary/i,
    /rate.?limit/i,
    /503/,
    /502/,
    /504/,
  ];

  return retryablePatterns.some((pattern) => pattern.test(error.message));
}

module.exports = {
  orchestrateDataProcessing,
  handleDataProcessingError,
  validateProcessingWorkflow,
};
