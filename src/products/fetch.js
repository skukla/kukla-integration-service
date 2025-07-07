/**
 * Products Domain - Fetch Module
 *
 * Consolidates all product fetching and enrichment functionality.
 * Following functional composition principles with pure functions
 * and clear input/output contracts.
 *
 * Performance Optimizations:
 * - Configurable batch processing with concurrency limits
 * - Memory-efficient array operations
 * - Optimized pagination with larger page sizes
 * - Intelligent request delays to prevent API rate limiting
 *
 * Commerce Integration Patterns:
 * - OAuth 1.0 authentication for all API calls
 * - Proper error handling with graceful degradation
 * - Category enrichment via custom_attributes fallback
 * - Inventory data with out-of-stock handling
 *
 * Migrated from:
 * - actions/backend/get-products/steps/fetchAndEnrichProducts.js
 * - actions/backend/get-products/lib/api/products.js
 * - actions/backend/get-products/lib/api/categories.js
 * - actions/backend/get-products/lib/api/inventory.js
 */

const { makeCommerceRequest } = require('../commerce').api;

/**
 * Fetch products from Commerce API with OAuth authentication
 *
 * This function implements efficient pagination to handle large product catalogs.
 * It uses configurable page sizes and maximum page limits to balance performance
 * with memory usage. The function fetches comprehensive product data including
 * categories, media galleries, and custom attributes.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {string} params.COMMERCE_CONSUMER_KEY - OAuth consumer key
 * @param {string} params.COMMERCE_CONSUMER_SECRET - OAuth consumer secret
 * @param {string} params.COMMERCE_ACCESS_TOKEN - OAuth access token
 * @param {string} params.COMMERCE_ACCESS_TOKEN_SECRET - OAuth access token secret
 * @param {Object} config - Configuration object with Commerce URL
 * @param {string} config.commerce.baseUrl - Commerce instance base URL
 * @param {number} [config.mesh.pagination.defaultPageSize=150] - Products per page
 * @param {number} [config.mesh.pagination.maxPages=25] - Maximum pages to fetch
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of product objects with full Commerce data
 * @throws {Error} If Commerce URL is not configured or API calls fail
 *
 * @example
 * const products = await fetchProducts(params, config, trace);
 * console.log(`Fetched ${products.length} products`);
 */
/**
 * Validates Commerce configuration for product fetching
 * @param {Object} config - Configuration object
 * @throws {Error} If Commerce URL is not configured
 */
function validateProductFetchConfig(config) {
  if (!config.commerce.baseUrl) {
    throw new Error('Commerce URL not configured in environment');
  }
}

/**
 * Gets pagination configuration with defaults
 * @param {Object} config - Configuration object
 * @returns {Object} Pagination settings
 */
function getPaginationConfig(config) {
  return {
    pageSize: config.mesh.pagination.defaultPageSize || config.products.batchSize || 50,
    maxPages: config.mesh.pagination.maxPages || 25,
  };
}

/**
 * Builds the products API endpoint URL with required fields
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number
 * @returns {string} Complete API endpoint URL
 */
function buildProductsApiUrl(pageSize, currentPage) {
  const fields =
    'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count';
  return `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=${fields}`;
}

/**
 * Checks if pagination should continue
 * @param {Object} response - API response body
 * @param {number} currentPage - Current page number
 * @param {number} pageSize - Items per page
 * @param {number} maxPages - Maximum pages to fetch
 * @returns {boolean} True if should continue pagination
 */
function shouldContinuePagination(response, currentPage, pageSize, maxPages) {
  if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
    return false;
  }

  const totalCount = response.body.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return currentPage < totalPages && currentPage < maxPages;
}

async function fetchProducts(params, config, trace = null) {
  validateProductFetchConfig(config);

  try {
    const allProducts = [];
    const { pageSize, maxPages } = getPaginationConfig(config);
    let currentPage = 1;

    do {
      const apiUrl = buildProductsApiUrl(pageSize, currentPage);
      const response = await makeCommerceRequest(apiUrl, { method: 'GET' }, config, params, trace);

      if (response.body && response.body.items && response.body.items.length > 0) {
        allProducts.push(...response.body.items);
      }

      if (!shouldContinuePagination(response, currentPage, pageSize, maxPages)) {
        break;
      }

      currentPage++;
    } while (currentPage <= maxPages);

    return allProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

/**
 * Extract unique category IDs from products
 * Pure function that extracts category IDs from product data.
 *
 * @param {Array} products - Array of product objects
 * @returns {Set} Set of unique category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  products.forEach((product) => {
    if (product.categories) {
      product.categories.forEach((cat) => {
        if (cat.id) categoryIds.add(cat.id);
      });
    }
    // Also check custom_attributes for category_ids
    if (product.custom_attributes) {
      const categoryAttr = product.custom_attributes.find(
        (attr) => attr.attribute_code === 'category_ids'
      );
      if (categoryAttr && categoryAttr.value) {
        const catIds = categoryAttr.value.split(',');
        catIds.forEach((id) => categoryIds.add(parseInt(id.trim())));
      }
    }
  });

  return categoryIds;
}

/**
 * Fetch category data from Commerce API in batches
 *
 * This function implements intelligent batch processing with concurrency control
 * to efficiently fetch category data. It handles large numbers of categories by:
 *
 * 1. Grouping category IDs into configurable batches (default: 20)
 * 2. Limiting concurrent requests per batch (default: 15)
 * 3. Adding configurable delays between chunks to prevent rate limiting
 * 4. Gracefully handling individual category fetch failures
 *
 * Performance Characteristics:
 * - Batch size: Optimized for Commerce API limits
 * - Concurrency: Prevents overwhelming the API server
 * - Request delays: Reduces risk of 429 rate limit errors
 * - Memory efficient: Processes categories in streaming fashion
 *
 * @param {Set} categoryIds - Set of unique category IDs to fetch
 * @param {Object} config - Configuration object with Commerce settings
 * @param {string} config.commerce.baseUrl - Commerce instance base URL
 * @param {number} [config.mesh.batching.categories=20] - Categories per batch
 * @param {number} [config.mesh.batching.maxConcurrent=15] - Max concurrent requests
 * @param {number} [config.mesh.batching.requestDelay=75] - Delay between chunks (ms)
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Object>} Map of category ID to category data
 *
 * @example
 * const categoryIds = new Set([1, 2, 3, 4, 5]);
 * const categoryMap = await fetchCategoryData(categoryIds, config, params);
 * console.log(`Fetched ${Object.keys(categoryMap).length} categories`);
 */
async function fetchCategoryData(categoryIds, config, params, trace = null) {
  const categoryMap = {};
  const categoryIdsArray = Array.from(categoryIds);

  // Use configurable batch settings for performance optimization
  const batchSize = config.mesh.batching.categories || 20;
  const requestDelay = config.mesh.batching.requestDelay || 75;
  const maxConcurrent = config.mesh.batching.maxConcurrent || 15;

  // Process in batches with configurable concurrency
  for (let i = 0; i < categoryIdsArray.length; i += batchSize) {
    const batch = categoryIdsArray.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const categoryPromises = chunk.map(async (categoryId) => {
        try {
          const response = await makeCommerceRequest(
            `/categories/${categoryId}`,
            { method: 'GET' },
            config,
            params,
            trace
          );

          if (response.body && response.body.id && response.body.name) {
            categoryMap[response.body.id] = {
              id: response.body.id,
              name: response.body.name,
              parent_id: response.body.parent_id,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}: ${error.message}`);
        }
      });

      await Promise.all(categoryPromises);

      // Add configurable delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return categoryMap;
}

/**
 * Enrich products with category data
 * Pure function that adds category information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} categoryMap - Map of category ID to category data
 * @returns {Array} Array of products enriched with categories
 */
function enrichProductsWithCategories(products, categoryMap) {
  return products.map((product) => {
    const enrichedProduct = { ...product };

    // Build categories array from available data
    const productCategories = [];

    if (product.categories) {
      product.categories.forEach((cat) => {
        if (categoryMap[cat.id]) {
          productCategories.push(categoryMap[cat.id]);
        }
      });
    }

    // Also check custom_attributes for additional categories
    if (product.custom_attributes) {
      const categoryAttr = product.custom_attributes.find(
        (attr) => attr.attribute_code === 'category_ids'
      );
      if (categoryAttr && categoryAttr.value) {
        const catIds = categoryAttr.value.split(',');
        catIds.forEach((id) => {
          const categoryId = parseInt(id.trim());
          if (categoryMap[categoryId] && !productCategories.find((c) => c.id === categoryId)) {
            productCategories.push(categoryMap[categoryId]);
          }
        });
      }
    }

    enrichedProduct.categories = productCategories;
    return enrichedProduct;
  });
}

/**
 * Enrich products with category data
 * Composition function that combines category ID extraction, fetching, and enrichment.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with categories
 */
async function enrichWithCategories(products, config, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  try {
    // Step 1: Extract unique category IDs from all products
    const categoryIds = extractCategoryIds(products);

    if (categoryIds.size === 0) {
      return products;
    }

    // Step 2: Fetch category data from Commerce API
    const categoryMap = await fetchCategoryData(categoryIds, config, params, trace);

    // Step 3: Enrich products with category data
    return enrichProductsWithCategories(products, categoryMap);
  } catch (error) {
    console.warn(`Category enrichment failed: ${error.message}`);
    return products; // Return products without category enrichment
  }
}

/**
 * Extract SKUs from products for inventory lookup
 * Pure function that extracts unique SKUs from product data.
 *
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of unique SKUs
 */
function extractProductSkus(products) {
  return products.map((product) => product.sku).filter(Boolean);
}

/**
 * Fetch inventory data from Commerce API in batches
 * API function that fetches inventory data for given SKUs.
 *
 * @param {Array} skus - Array of SKUs to fetch inventory for
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Map of SKU to inventory data
 */
async function fetchInventoryData(skus, config, params, trace = null) {
  const inventoryMap = {};

  // Use configurable batch settings for performance optimization
  const batchSize = config.mesh.batching.inventory || 25;
  const requestDelay = config.mesh.batching.requestDelay || 75;
  const maxConcurrent = config.mesh.batching.maxConcurrent || 15;

  // Process in batches with configurable concurrency
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const inventoryPromises = chunk.map(async (sku) => {
        try {
          const response = await makeCommerceRequest(
            `/stockItems/${sku}`,
            { method: 'GET' },
            config,
            params,
            trace
          );

          if (response.body) {
            inventoryMap[sku] = {
              qty: response.body.qty || 0,
              is_in_stock: response.body.is_in_stock || false,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch inventory for ${sku}: ${error.message}`);
          inventoryMap[sku] = { qty: 0, is_in_stock: false };
        }
      });

      await Promise.all(inventoryPromises);

      // Add configurable delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestDelay));
      }
    }
  }

  return inventoryMap;
}

/**
 * Enrich products with inventory data
 * Pure function that adds inventory information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} inventoryMap - Map of SKU to inventory data
 * @returns {Array} Array of products enriched with inventory
 */
function enrichProductsWithInventory(products, inventoryMap) {
  return products.map((product) => ({
    ...product,
    qty: inventoryMap[product.sku]?.qty || 0,
    is_in_stock: inventoryMap[product.sku]?.is_in_stock || false,
  }));
}

/**
 * Enrich products with inventory data
 * Composition function that combines SKU extraction, fetching, and enrichment.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with inventory
 */
async function enrichWithInventory(products, config, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  try {
    // Step 1: Extract SKUs for inventory lookup
    const skus = extractProductSkus(products);
    if (skus.length === 0) {
      return products;
    }

    // Step 2: Fetch inventory data from Commerce API
    const inventoryMap = await fetchInventoryData(skus, config, params, trace);

    // Step 3: Enrich products with inventory data
    return enrichProductsWithInventory(products, inventoryMap);
  } catch (error) {
    console.warn(`Inventory enrichment failed: ${error.message}`);
    return products; // Return products without inventory enrichment
  }
}

/**
 * Fetch and enrich products with all data (categories and inventory)
 *
 * This is the main composition function that orchestrates the complete product
 * data enrichment pipeline. It combines multiple data sources to create a
 * comprehensive product dataset suitable for CSV export or frontend display.
 *
 * Data Pipeline:
 * 1. Fetch base product data from Commerce API (paginated)
 * 2. Extract category IDs from products and custom_attributes
 * 3. Batch fetch category details with concurrency control
 * 4. Enrich products with category names and hierarchy
 * 5. Extract SKUs for inventory lookup
 * 6. Batch fetch inventory data with concurrency control
 * 7. Enrich products with stock quantities and availability
 *
 * Error Handling Strategy:
 * - Individual category/inventory failures are logged but don't stop processing
 * - Products without categories/inventory data are included with defaults
 * - Network timeouts and rate limits are handled gracefully
 * - Configuration errors cause immediate failure with clear messages
 *
 * Performance Optimizations:
 * - Configurable batch sizes optimized for Commerce API limits
 * - Intelligent concurrency control to prevent API overload
 * - Memory-efficient streaming processing for large catalogs
 * - Optimized request timing to avoid rate limiting
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {string} params.COMMERCE_CONSUMER_KEY - OAuth consumer key
 * @param {string} params.COMMERCE_CONSUMER_SECRET - OAuth consumer secret
 * @param {string} params.COMMERCE_ACCESS_TOKEN - OAuth access token
 * @param {string} params.COMMERCE_ACCESS_TOKEN_SECRET - OAuth access token secret
 * @param {Object} config - Configuration object with Commerce URL and performance settings
 * @param {string} config.commerce.baseUrl - Commerce instance base URL
 * @param {Object} config.mesh.pagination - Pagination configuration
 * @param {Object} config.mesh.batching - Batch processing configuration
 * @param {Object} [trace] - Optional trace context for API call tracking and performance monitoring
 * @returns {Promise<Array>} Array of fully enriched product objects with categories, inventory, and media
 * @throws {Error} If Commerce URL is missing, authentication fails, or critical API errors occur
 *
 * @example
 * const enrichedProducts = await fetchAndEnrichProducts(params, config, trace);
 * console.log(`Enriched ${enrichedProducts.length} products with full data`);
 *
 * @example
 * // Example enriched product structure:
 * {
 *   id: 123,
 *   sku: "PROD-001",
 *   name: "Sample Product",
 *   price: 29.99,
 *   categories: [
 *     { id: 5, name: "Electronics", parent_id: 2 }
 *   ],
 *   qty: 100,
 *   is_in_stock: true,
 *   media_gallery_entries: [
 *     { file: "/image.jpg", url: "https://...", position: 1 }
 *   ]
 * }
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  try {
    const products = await fetchProducts(params, config, trace);

    // Enrich with categories first, then inventory
    const categorizedProducts = await enrichWithCategories(products, config, params, trace);
    const fullyEnrichedProducts = await enrichWithInventory(
      categorizedProducts,
      config,
      params,
      trace
    );

    return fullyEnrichedProducts;
  } catch (error) {
    throw new Error(`Product fetch and enrichment failed: ${error.message}`);
  }
}

module.exports = {
  fetchProducts,
  enrichWithCategories,
  enrichWithInventory,
  fetchAndEnrichProducts,
};
