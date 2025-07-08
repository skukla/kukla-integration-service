/**
 * Commerce Data Processing Operations
 *
 * Mid-level business processes for Commerce data transformation and enrichment.
 * Coordinates complex data processing workflows for products, categories, and inventory.
 */

const {
  validateProducts,
  filterProductFields,
  normalizeProduct,
} = require('../utils/data-validation');
const {
  enrichProductWithCategories,
  enrichProductWithInventory,
  processInventoryResponses,
  processCategoryResponses,
} = require('../utils/response-processors');

/**
 * Processes and validates a batch of products
 * @param {Array<Object>} products - Raw product data
 * @param {Object} config - Configuration object
 * @param {Object} [options] - Processing options
 * @param {Array<string>} [options.fields] - Fields to include
 * @param {boolean} [options.validate=true] - Whether to validate products
 * @returns {Object} Processed product data with validation results
 */
function processProductBatch(products, config, options = {}) {
  const { fields, validate = true } = options;

  if (!Array.isArray(products)) {
    return {
      products: [],
      validation: {
        isValid: false,
        errors: ['Products must be an array'],
        validCount: 0,
        invalidCount: 0,
        totalCount: 0,
      },
    };
  }

  // Step 1: Normalize products
  const normalizedProducts = products.map(normalizeProduct);

  // Step 2: Filter fields if requested
  const filteredProducts = fields
    ? normalizedProducts.map((product) => filterProductFields(product, fields))
    : normalizedProducts;

  // Step 3: Validate products if requested
  const validation = validate
    ? validateProducts(filteredProducts, config)
    : {
        isValid: true,
        validCount: filteredProducts.length,
        invalidCount: 0,
        totalCount: filteredProducts.length,
        errors: [],
      };

  return {
    products: filteredProducts,
    validation,
  };
}

/**
 * Processes inventory data for multiple products
 * @param {Array<Object>} inventoryResponses - Raw inventory API responses
 * @param {Array<Object>} products - Product objects with SKUs
 * @returns {Object} Processed inventory data mapped to products
 */
function processInventoryData(inventoryResponses, products) {
  if (!Array.isArray(inventoryResponses) || !Array.isArray(products)) {
    return {
      inventoryMap: {},
      processedCount: 0,
      totalCount: products?.length || 0,
    };
  }

  // Process all inventory responses into a unified map
  const inventoryMap = processInventoryResponses(inventoryResponses);

  // Count how many products have inventory data
  const processedCount = products.filter(
    (product) => product.sku && inventoryMap[product.sku]
  ).length;

  return {
    inventoryMap,
    processedCount,
    totalCount: products.length,
  };
}

/**
 * Processes category data for multiple products
 * @param {Array<Object>} categoryResponses - Raw category API responses
 * @param {Array<Object>} products - Product objects with category IDs
 * @returns {Object} Processed category data mapped to products
 */
function processCategoryData(categoryResponses, products) {
  if (!Array.isArray(categoryResponses) || !Array.isArray(products)) {
    return {
      categoryMap: {},
      processedCount: 0,
      totalCount: products?.length || 0,
    };
  }

  // Process all category responses into a unified map
  const categoryMap = processCategoryResponses(categoryResponses);

  // Count how many products have category data
  let processedCount = 0;
  products.forEach((product) => {
    if (Array.isArray(product.categories)) {
      const hasCategories = product.categories.some((cat) => categoryMap[String(cat.id || cat)]);
      if (hasCategories) processedCount++;
    }
  });

  return {
    categoryMap,
    processedCount,
    totalCount: products.length,
  };
}

/**
 * Enriches products with category and inventory data
 * @param {Array<Object>} products - Product objects
 * @param {Object} categoryMap - Map of category IDs to category data
 * @param {Object} inventoryMap - Map of SKUs to inventory data
 * @param {Object} [options] - Enrichment options
 * @param {boolean} [options.includeCategories=true] - Whether to enrich with categories
 * @param {boolean} [options.includeInventory=true] - Whether to enrich with inventory
 * @returns {Object} Enrichment result
 */
function enrichProductData(products, categoryMap, inventoryMap, options = {}) {
  const { includeCategories = true, includeInventory = true } = options;

  if (!Array.isArray(products)) {
    return {
      enrichedProducts: [],
      enrichmentStats: {
        totalProducts: 0,
        categoriesEnriched: 0,
        inventoryEnriched: 0,
      },
    };
  }

  let enrichedProducts = [...products];
  let categoriesEnriched = 0;
  let inventoryEnriched = 0;

  // Enrich with categories if requested and available
  if (includeCategories && categoryMap && Object.keys(categoryMap).length > 0) {
    enrichedProducts = enrichedProducts.map((product) => {
      const enriched = enrichProductWithCategories(product, categoryMap);
      if (enriched.categories && enriched.categories.length > 0) {
        categoriesEnriched++;
      }
      return enriched;
    });
  }

  // Enrich with inventory if requested and available
  if (includeInventory && inventoryMap && Object.keys(inventoryMap).length > 0) {
    enrichedProducts = enrichedProducts.map((product) => {
      if (product.sku && inventoryMap[product.sku]) {
        inventoryEnriched++;
        return enrichProductWithInventory(product, inventoryMap[product.sku]);
      }
      return product;
    });
  }

  return {
    enrichedProducts,
    enrichmentStats: {
      totalProducts: products.length,
      categoriesEnriched,
      inventoryEnriched,
    },
  };
}

/**
 * Orchestrates complete product data processing workflow
 * @param {Object} rawData - Raw API response data
 * @param {Array<Object>} rawData.products - Raw product data
 * @param {Array<Object>} rawData.categories - Raw category responses
 * @param {Array<Object>} rawData.inventory - Raw inventory responses
 * @param {Object} config - Configuration object
 * @param {Object} [options] - Processing options
 * @returns {Object} Complete processed data
 */
function orchestrateDataProcessing(rawData, config, options = {}) {
  const {
    products: rawProducts = [],
    categories: rawCategories = [],
    inventory: rawInventory = [],
  } = rawData;

  // Step 1: Process product batch
  const productResult = processProductBatch(rawProducts, config, options);

  // Step 2: Process category data
  const categoryResult = processCategoryData(rawCategories, productResult.products);

  // Step 3: Process inventory data
  const inventoryResult = processInventoryData(rawInventory, productResult.products);

  // Step 4: Enrich products with processed data
  const enrichmentResult = enrichProductData(
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
 * Handles data processing errors with context
 * @param {Error} error - Processing error
 * @param {Object} context - Processing context
 * @returns {Object} Enhanced error information
 */
function handleDataProcessingError(error, context = {}) {
  const { stage, dataType, itemCount } = context;

  return {
    originalError: error,
    context: {
      stage: stage || 'unknown',
      dataType: dataType || 'unknown',
      itemCount: itemCount || 0,
      timestamp: new Date().toISOString(),
    },
    enhancedMessage: `Data processing failed at ${stage || 'unknown stage'}: ${error.message}`,
    isRetryable: !error.message.includes('Invalid') && !error.message.includes('format'),
  };
}

module.exports = {
  processProductBatch,
  processInventoryData,
  processCategoryData,
  enrichProductData,
  orchestrateDataProcessing,
  handleDataProcessingError,
};
