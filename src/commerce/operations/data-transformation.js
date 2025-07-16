/**
 * Commerce Data Transformation Operations
 *
 * Pure data transformation functions for Commerce data processing.
 * Extracted from data-processing.js to separate processing from orchestration.
 * Contains no workflow logic - only pure data transformations.
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
 * Transforms and validates a batch of products
 * Pure processing function focused only on product transformation.
 *
 * @param {Array<Object>} products - Raw product data
 * @param {Object} config - Configuration object
 * @param {Object} options - Processing options
 * @returns {Object} Processed product data with validation results
 */
function transformProductBatch(products, config, options = {}) {
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

  // Normalize and filter products
  const normalizedProducts = products.map(normalizeProduct);
  const filteredProducts = fields
    ? normalizedProducts.map((product) => filterProductFields(product, fields))
    : normalizedProducts;

  // Validate if requested
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
 * Transforms inventory data into product-mapped format
 * Pure processing function focused only on inventory transformation.
 *
 * @param {Array<Object>} inventoryResponses - Raw inventory API responses
 * @param {Array<Object>} products - Product objects with SKUs
 * @returns {Object} Processed inventory data mapped to products
 */
function transformInventoryData(inventoryResponses, products) {
  if (!Array.isArray(inventoryResponses) || !Array.isArray(products)) {
    return {
      inventoryMap: {},
      processedCount: 0,
      totalCount: products?.length || 0,
    };
  }

  const inventoryMap = processInventoryResponses(inventoryResponses);
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
 * Transforms category data into product-mapped format
 * Pure processing function focused only on category transformation.
 *
 * @param {Array<Object>} categoryResponses - Raw category API responses
 * @param {Array<Object>} products - Product objects with category IDs
 * @returns {Object} Processed category data mapped to products
 */
function transformCategoryData(categoryResponses, products) {
  if (!Array.isArray(categoryResponses) || !Array.isArray(products)) {
    return {
      categoryMap: {},
      processedCount: 0,
      totalCount: products?.length || 0,
    };
  }

  const categoryMap = processCategoryResponses(categoryResponses);
  const processedCount = products.filter((product) => {
    const categoryIds = getCategoryIds(product);
    return categoryIds.some((id) => categoryMap[id]);
  }).length;

  return {
    categoryMap,
    processedCount,
    totalCount: products.length,
  };
}

/**
 * Enriches products with category and inventory data
 * Pure processing function focused only on product enrichment.
 *
 * @param {Array<Object>} products - Base product data
 * @param {Object} categoryMap - Category data mapped by ID
 * @param {Object} inventoryMap - Inventory data mapped by SKU
 * @param {Object} options - Enrichment options
 * @returns {Object} Enriched products with transformation stats
 */
function enrichProductsWithData(products, categoryMap, inventoryMap, options = {}) {
  if (!Array.isArray(products)) {
    return {
      enrichedProducts: [],
      enrichmentStats: {
        totalProducts: 0,
        categoriesAdded: 0,
        inventoryAdded: 0,
        mediaProcessed: 0,
      },
    };
  }

  let categoriesAdded = 0;
  let inventoryAdded = 0;
  let mediaProcessed = 0;

  const enrichedProducts = products.map((product) => {
    let enrichedProduct = { ...product };

    // Enrich with categories
    if (categoryMap && Object.keys(categoryMap).length > 0) {
      enrichedProduct = enrichProductWithCategories(enrichedProduct, categoryMap);
      if (enrichedProduct.categories && enrichedProduct.categories.length > 0) {
        categoriesAdded++;
      }
    }

    // Enrich with inventory
    if (inventoryMap && Object.keys(inventoryMap).length > 0) {
      enrichedProduct = enrichProductWithInventory(enrichedProduct, inventoryMap);
      if (enrichedProduct.inventory) {
        inventoryAdded++;
      }
    }

    // Process media if enabled
    if (options.processMedia && enrichedProduct.media_gallery_entries) {
      enrichedProduct.media_gallery_entries = transformMediaEntries(
        enrichedProduct.media_gallery_entries,
        options.config
      );
      mediaProcessed++;
    }

    return enrichedProduct;
  });

  return {
    enrichedProducts,
    enrichmentStats: {
      totalProducts: products.length,
      categoriesAdded,
      inventoryAdded,
      mediaProcessed,
    },
  };
}

/**
 * Extracts category IDs from product data
 * Pure utility function for extracting category identifiers.
 *
 * @param {Array<Object>} products - Product objects
 * @returns {Array<number>} Unique category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  products.forEach((product) => {
    const productCategoryIds = getCategoryIds(product);
    productCategoryIds.forEach((id) => categoryIds.add(id));
  });

  return Array.from(categoryIds);
}

/**
 * Extracts SKUs from product data
 * Pure utility function for extracting product SKUs.
 *
 * @param {Array<Object>} products - Product objects
 * @returns {Array<string>} Product SKUs
 */
function extractProductSkus(products) {
  return products.map((product) => product.sku).filter(Boolean);
}

/**
 * Transforms media entries with proper URLs
 * Pure utility function for media URL transformation.
 *
 * @param {Array<Object>} mediaEntries - Raw media entries
 * @param {Object} config - Configuration for URL building
 * @returns {Array<Object>} Transformed media entries
 */
function transformMediaEntries(mediaEntries, config) {
  if (!Array.isArray(mediaEntries)) {
    return [];
  }

  return mediaEntries.map((entry) => ({
    ...entry,
    url: buildMediaUrl(entry, config),
  }));
}

/**
 * Helper function to get category IDs from product
 * @param {Object} product - Product object
 * @returns {Array<number>} Category IDs
 */
function getCategoryIds(product) {
  if (!product) return [];

  // Handle different category ID formats
  if (product.category_ids && Array.isArray(product.category_ids)) {
    return product.category_ids.map(Number).filter(Boolean);
  }

  if (product.categories && Array.isArray(product.categories)) {
    return product.categories
      .map((cat) => cat.id || cat.category_id)
      .map(Number)
      .filter(Boolean);
  }

  return [];
}

/**
 * Helper function to build media URLs
 * @param {Object} entry - Media entry object
 * @param {Object} config - Configuration object
 * @returns {string} Built media URL
 */
function buildMediaUrl(entry, config) {
  if (!entry.file || !config.commerce.baseUrl) {
    return '';
  }

  const baseUrl = config.commerce.baseUrl.replace(/\/$/, '');
  const file = entry.file.startsWith('/') ? entry.file : `/${entry.file}`;

  return `${baseUrl}/pub/media/catalog/product${file}`;
}

module.exports = {
  transformProductBatch,
  transformInventoryData,
  transformCategoryData,
  enrichProductsWithData,
  extractCategoryIds,
  extractProductSkus,
  transformMediaEntries,
};
