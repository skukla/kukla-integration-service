/**
 * Commerce Response Processor Utilities
 *
 * Low-level pure functions for processing Commerce API responses.
 * Contains processors for inventory, category, and product data enrichment.
 */

/**
 * Processes inventory data from Commerce API response
 * @param {Object} inventoryResponse - API response containing inventory data
 * @returns {Object} Processed inventory data
 */
function processInventoryResponse(inventoryResponse) {
  if (!inventoryResponse || !inventoryResponse.items || !Array.isArray(inventoryResponse.items)) {
    return {
      qty: 0,
      is_in_stock: false,
    };
  }

  const totalQty = inventoryResponse.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const isInStock = inventoryResponse.items.some((item) => item.status === 1);

  return {
    qty: totalQty,
    is_in_stock: isInStock,
  };
}

/**
 * Processes category data from Commerce API response
 * @param {Object} categoryResponse - API response containing category data
 * @returns {Object} Processed category data
 */
function processCategoryResponse(categoryResponse) {
  if (!categoryResponse || !categoryResponse.id) {
    return null;
  }

  return {
    id: String(categoryResponse.id),
    name: categoryResponse.name || '',
    path: categoryResponse.path || '',
    level: categoryResponse.level || 0,
    parent_id: categoryResponse.parent_id || null,
    children: categoryResponse.children || [],
  };
}

/**
 * Creates a category map from array of categories
 * @param {Array<Object>} categories - Array of category objects
 * @returns {Object} Map of category ID to category name
 */
function createCategoryMap(categories) {
  const categoryMap = {};

  if (!Array.isArray(categories)) {
    return categoryMap;
  }

  categories.forEach((category) => {
    if (category && category.id && category.name) {
      categoryMap[String(category.id)] = category.name;
    }
  });

  return categoryMap;
}

/**
 * Enriches product data with category information
 * @param {Object} product - Product object
 * @param {Object} categoryMap - Map of category IDs to names
 * @returns {Object} Product with enriched category data
 */
function enrichProductWithCategories(product, categoryMap) {
  if (!product || !categoryMap) {
    return product;
  }

  // Import getCategoryIds function from validation utilities
  const { getCategoryIds } = require('./data-validation');

  const categoryIds = getCategoryIds(product);
  const categories = categoryIds
    .map((id) => ({
      id: String(id),
      name: categoryMap[String(id)] || `Category ${id}`,
    }))
    .filter((category) => category.name !== `Category ${category.id}`);

  return {
    ...product,
    categories,
  };
}

/**
 * Enriches product data with inventory information
 * @param {Object} product - Product object
 * @param {Object} inventoryData - Inventory data object
 * @returns {Object} Product with enriched inventory data
 */
function enrichProductWithInventory(product, inventoryData) {
  if (!product || !inventoryData) {
    return product;
  }

  return {
    ...product,
    qty: inventoryData.qty || 0,
    is_in_stock: inventoryData.is_in_stock || false,
    inventory: inventoryData,
  };
}

/**
 * Processes multiple inventory responses into a map
 * @param {Array<Object>} inventoryResponses - Array of inventory API responses
 * @returns {Object} Map of SKU to inventory data
 */
function processInventoryResponses(inventoryResponses) {
  const inventoryMap = {};

  if (!Array.isArray(inventoryResponses)) {
    return inventoryMap;
  }

  inventoryResponses.forEach((response) => {
    if (response && response.items && Array.isArray(response.items)) {
      response.items.forEach((item) => {
        if (item.sku) {
          inventoryMap[item.sku] = {
            qty: item.quantity || 0,
            is_in_stock: item.status === 1,
            sku: item.sku,
          };
        }
      });
    }
  });

  return inventoryMap;
}

/**
 * Processes multiple category responses into a map
 * @param {Array<Object>} categoryResponses - Array of category API responses
 * @returns {Object} Map of category ID to category data
 */
function processCategoryResponses(categoryResponses) {
  const categoryMap = {};

  if (!Array.isArray(categoryResponses)) {
    return categoryMap;
  }

  categoryResponses.forEach((response) => {
    const processed = processCategoryResponse(response);
    if (processed) {
      categoryMap[processed.id] = processed;
    }
  });

  return categoryMap;
}

/**
 * Enriches a product with both category and inventory data
 * @param {Object} product - Product object
 * @param {Object} categoryMap - Map of category IDs to category data
 * @param {Object} inventoryMap - Map of SKUs to inventory data
 * @returns {Object} Fully enriched product
 */
function enrichProductFully(product, categoryMap, inventoryMap) {
  if (!product) {
    return product;
  }

  // First enrich with categories
  let enrichedProduct = enrichProductWithCategories(product, categoryMap);

  // Then enrich with inventory data if available
  if (inventoryMap && product.sku && inventoryMap[product.sku]) {
    enrichedProduct = enrichProductWithInventory(enrichedProduct, inventoryMap[product.sku]);
  }

  return enrichedProduct;
}

/**
 * Enriches multiple products with category and inventory data
 * @param {Array<Object>} products - Array of product objects
 * @param {Object} categoryMap - Map of category IDs to category data
 * @param {Object} inventoryMap - Map of SKUs to inventory data
 * @returns {Array<Object>} Array of enriched products
 */
function enrichProductsBatch(products, categoryMap, inventoryMap) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => enrichProductFully(product, categoryMap, inventoryMap));
}

/**
 * Extracts pagination information from Commerce API response
 * @param {Object} response - Commerce API response
 * @returns {Object} Pagination information
 */
function extractPaginationInfo(response) {
  return {
    totalCount: response.total_count || 0,
    currentPage: response.search_criteria?.current_page || 1,
    pageSize: response.search_criteria?.page_size || 20,
    totalPages: Math.ceil(
      (response.total_count || 0) / (response.search_criteria?.page_size || 20)
    ),
  };
}

/**
 * Processes a standard Commerce API list response
 * @param {Object} response - Commerce API response
 * @returns {Object} Processed response with items and pagination
 */
function processListResponse(response) {
  if (!response || typeof response !== 'object') {
    return {
      items: [],
      pagination: {
        totalCount: 0,
        currentPage: 1,
        pageSize: 20,
        totalPages: 0,
      },
    };
  }

  return {
    items: response.items || [],
    pagination: extractPaginationInfo(response),
  };
}

module.exports = {
  processInventoryResponse,
  processCategoryResponse,
  createCategoryMap,
  enrichProductWithCategories,
  enrichProductWithInventory,
  processInventoryResponses,
  processCategoryResponses,
  enrichProductFully,
  enrichProductsBatch,
  extractPaginationInfo,
  processListResponse,
};
