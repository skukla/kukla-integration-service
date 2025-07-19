/**
 * Products Product Enrichment
 * Complete product enrichment capability with category and inventory data integration
 */

// All dependencies at top - external vs internal obvious from paths
const { executeAdminTokenCommerceRequest } = require('../commerce/admin-token-auth');
const { extractCategoryIds, extractProductSkus } = require('./shared/data-extraction');
const { sleep } = require('../shared/utils/async');

// Business Workflows

/**
 * Complete product enrichment workflow with all data sources
 * @purpose Execute comprehensive product enrichment pipeline with category and inventory data
 * @param {Array} products - Array of product objects to enrich
 * @param {Object} config - Complete configuration object with Commerce API settings
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Array>} Array of fully enriched product objects
 * @throws {Error} When Commerce API is unavailable or enrichment fails
 * @usedBy exportProducts in rest-export.js, exportMeshProducts in mesh-export.js
 * @config commerce.baseUrl, commerce.batching.categories, commerce.batching.inventory
 */
async function enrichProductsWithAllData(products, config, params) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Enrich with categories first
    const productsWithCategories = await enrichProductsWithCategories(products, config, params);

    // Step 2: Enrich with inventory data
    const fullyEnrichedProducts = await enrichProductsWithInventory(
      productsWithCategories,
      config,
      params
    );

    return fullyEnrichedProducts;
  } catch (error) {
    console.warn(`Complete product enrichment failed: ${error.message}`);
    return products; // Return products without enrichment
  }
}

/**
 * Enrich products with category data only
 * @purpose Add category information to product objects with intelligent batching
 * @param {Array} products - Array of product objects to enrich with categories
 * @param {Object} config - Configuration object with Commerce API settings
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Array>} Array of products enriched with category data
 * @throws {Error} When category enrichment fails critically
 * @usedBy enrichProductsWithAllData, standalone category enrichment
 * @config commerce.baseUrl, commerce.batching.categories
 */
async function enrichProductsWithCategories(products, config, params) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Extract unique category IDs from all products
    const categoryIds = extractCategoryIds(products);
    if (categoryIds.size === 0) {
      return products; // No categories to enrich
    }

    // Step 2: Fetch category data from Commerce API
    const categoryMap = await fetchCategoriesInBatches(categoryIds, config, params);

    // Step 3: Apply category data to products
    return applyCategoriesToProducts(products, categoryMap);
  } catch (error) {
    console.warn(`Category enrichment failed: ${error.message}`);
    return products; // Return products without category enrichment
  }
}

/**
 * Enrich products with inventory data only
 * @purpose Add inventory information to product objects with intelligent batching
 * @param {Array} products - Array of product objects to enrich with inventory
 * @param {Object} config - Configuration object with Commerce API settings
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Array>} Array of products enriched with inventory data
 * @throws {Error} When inventory enrichment fails critically
 * @usedBy enrichProductsWithAllData, standalone inventory enrichment
 * @config commerce.baseUrl, commerce.batching.inventory
 */
async function enrichProductsWithInventory(products, config, params) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    // Step 1: Extract unique SKUs for inventory lookup
    const skus = extractProductSkus(products);
    if (skus.length === 0) {
      return products; // No SKUs to enrich
    }

    // Step 2: Fetch inventory data from Commerce API
    const inventoryMap = await fetchInventoryDataInBatches(skus, config, params);

    // Step 3: Apply inventory data to products
    return applyInventoryToProducts(products, inventoryMap);
  } catch (error) {
    console.warn(`Inventory enrichment failed: ${error.message}`);
    return products; // Return products without inventory enrichment
  }
}

// Feature Operations

/**
 * Fetch categories in optimized batches
 * @purpose Retrieve category data for products using batched requests for optimal performance
 * @param {Set} categoryIds - Set of unique category IDs to fetch
 * @param {Object} config - Configuration with batching settings
 * @param {Object} params - Parameters with authentication
 * @returns {Promise<Map>} Map of category ID to category data
 * @usedBy enrichProductsWithCategories
 */
async function fetchCategoriesInBatches(categoryIds, config, params) {
  if (!categoryIds || categoryIds.size === 0) {
    return new Map();
  }

  const batchConfig = extractBatchingConfig(config);
  const categoryArray = Array.from(categoryIds);
  const categoryMap = new Map();
  const errors = [];

  await processCategoryBatches(
    categoryArray,
    batchConfig,
    { categoryMap, errors },
    { config, params }
  );

  if (errors.length > 0) {
    console.warn(
      `Category enrichment warnings: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
    );
  }

  return categoryMap;
}

/**
 * Extract batching configuration settings
 * @purpose Get batching settings from configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Batching configuration settings
 */
function extractBatchingConfig(config) {
  return {
    batchSize: config.commerce.batching.categories,
    requestDelay: config.performance.batching.requestDelay,
    maxConcurrent: config.performance.batching.maxConcurrent,
  };
}

/**
 * Process category batches with controlled concurrency
 * @purpose Process categories in batches with rate limiting
 * @param {Array} categoryArray - Array of category IDs
 * @param {Object} batchConfig - Batching configuration
 * @param {Object} results - Results object containing categoryMap and errors
 * @param {Object} requestConfig - Configuration and parameters for requests
 */
async function processCategoryBatches(categoryArray, batchConfig, results, requestConfig) {
  const { batchSize, requestDelay, maxConcurrent } = batchConfig;
  const { errors } = results;

  for (let i = 0; i < categoryArray.length; i += batchSize) {
    const batch = categoryArray.slice(i, i + batchSize);

    try {
      await processSingleCategoryBatch(batch, maxConcurrent, results, requestConfig);

      if (i + batchSize < categoryArray.length) {
        await sleep(requestDelay);
      }
    } catch (error) {
      errors.push(`Batch processing error: ${error.message}`);
    }
  }
}

/**
 * Process a single batch of categories
 * @purpose Process one batch of categories with concurrency control
 * @param {Array} batch - Batch of category IDs
 * @param {number} maxConcurrent - Maximum concurrent requests
 * @param {Object} results - Results object containing categoryMap and errors
 * @param {Object} requestConfig - Configuration and parameters for requests
 */
async function processSingleCategoryBatch(batch, maxConcurrent, results, requestConfig) {
  const { categoryMap, errors } = results;
  const { config, params } = requestConfig;

  const batchPromises = batch.slice(0, maxConcurrent).map(async (categoryId) => {
    try {
      const endpoint = `/categories/${categoryId}`;
      const response = await executeAdminTokenCommerceRequest(
        endpoint,
        { method: 'GET' },
        config,
        params
      );

      if (response.success && response.body) {
        categoryMap.set(categoryId, {
          id: response.body.id,
          name: response.body.name,
          path: response.body.path,
          level: response.body.level,
          position: response.body.position,
          parent_id: response.body.parent_id,
        });
      }
    } catch (error) {
      errors.push(`Category ${categoryId}: ${error.message}`);
    }
  });

  await Promise.all(batchPromises);
}

/**
 * Fetch inventory data from Commerce API with intelligent batching
 * @purpose Retrieve stock information with batch processing for optimal performance
 * @param {Array} skus - Array of product SKUs to fetch inventory for
 * @param {Object} config - Configuration with batching settings
 * @param {Object} params - Parameters with authentication
 * @returns {Promise<Object>} Map of SKU to inventory data
 * @usedBy enrichProductsWithInventory
 */
async function fetchInventoryDataInBatches(skus, config, params) {
  const inventoryMap = {};

  if (!skus || skus.length === 0) {
    return inventoryMap;
  }

  const batchSize = config.commerce.batching.inventory;
  const requestDelay = config.performance.batching.requestDelay;
  const maxConcurrent = config.performance.batching.maxConcurrent;

  // Process SKUs in batches
  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);

    try {
      const inventoryPromises = batch.slice(0, maxConcurrent).map(async (sku) => {
        try {
          const response = await executeAdminTokenCommerceRequest(
            `/stockItems/${sku}`,
            { method: 'GET' },
            config,
            params
          );

          if (response.success && response.body) {
            inventoryMap[sku] = {
              sku: sku,
              qty: response.body.qty,
              is_in_stock: response.body.is_in_stock,
              stock_status: response.body.stock_status,
              manage_stock: response.body.manage_stock,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch inventory for SKU ${sku}: ${error.message}`);
          // Provide default inventory data for failed requests
          inventoryMap[sku] = {
            sku: sku,
            qty: 0,
            is_in_stock: false,
            stock_status: 'out_of_stock',
            manage_stock: true,
          };
        }
      });

      await Promise.all(inventoryPromises);

      // Delay between batches
      if (i + batchSize < skus.length) {
        await sleep(requestDelay);
      }
    } catch (error) {
      console.warn(`Inventory batch processing error: ${error.message}`);
    }
  }

  return inventoryMap;
}

// Feature Utilities

/**
 * Apply category data to products with comprehensive mapping
 * @purpose Map fetched category data to products with support for different category storage formats
 * @param {Array} products - Array of product objects to enhance with category information
 * @param {Object} categoryMap - Map of category ID to complete category data
 * @returns {Array} Array of products enhanced with complete category information
 * @usedBy enrichProductsWithCategories
 */
function applyCategoriesToProducts(products, categoryMap) {
  return products.map((product) => {
    // Extract category IDs using the utility function
    const categoryIds = extractCategoryIds([product]);

    // Map IDs to full category objects
    const categories = Array.from(categoryIds)
      .map((id) => categoryMap.get(String(id)))
      .filter(Boolean);

    return {
      ...product,
      categories: categories.length > 0 ? categories : product.categories || [],
    };
  });
}

/**
 * Apply inventory data to products with comprehensive mapping
 * @purpose Map fetched inventory data to products with support for different inventory storage formats
 * @param {Array} products - Array of product objects to enhance with inventory information
 * @param {Object} inventoryMap - Map of SKU to complete inventory data
 * @returns {Array} Array of products enhanced with complete inventory information
 * @usedBy enrichProductsWithInventory
 */
function applyInventoryToProducts(products, inventoryMap) {
  return products.map((product) => {
    const sku = product.sku;
    const inventory = inventoryMap[sku];

    if (inventory) {
      return {
        ...product,
        qty: inventory.qty,
        is_in_stock: inventory.is_in_stock,
        inventory: inventory,
      };
    }

    return {
      ...product,
      qty: product.qty || 0,
      is_in_stock: product.is_in_stock || false,
    };
  });
}

/**
 * Validate enrichment parameters for all workflows
 * @purpose Ensure required parameters are present and valid for enrichment operations
 * @param {Array} products - Products array to validate
 * @param {Object} config - Configuration object to validate
 * @param {Object} params - Action parameters to validate
 * @throws {Error} When required parameters are missing or invalid
 * @usedBy all enrichment workflows
 */
function validateEnrichmentParameters(products, config, params) {
  if (!Array.isArray(products)) {
    throw new Error('Products must be an array');
  }

  if (!config || !config.commerce) {
    throw new Error('Commerce configuration is required for enrichment');
  }

  if (!params) {
    throw new Error('Action parameters are required for enrichment authentication');
  }
}

module.exports = {
  // Business workflows (main exports that other files import)
  enrichProductsWithAllData,
  enrichProductsWithCategories,
  enrichProductsWithInventory,

  // Feature operations (coordination functions)
  fetchCategoriesInBatches,
  fetchInventoryDataInBatches,

  // Feature utilities (building blocks)
  applyCategoriesToProducts,
  applyInventoryToProducts,
  validateEnrichmentParameters,
};
