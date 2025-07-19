/**
 * Products Product Enrichment
 * Complete product enrichment capability with category and inventory data integration
 */

// All dependencies at top - external vs internal obvious from paths
const { executeAdminTokenCommerceRequest } = require('../commerce/admin-token-auth');
const { extractCategoryIds, extractProductSkus } = require('./shared/data-extraction');

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
    const categoryMap = await fetchCategoryDataInBatches(categoryIds, config, params);

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
 * Fetch category data from Commerce API with intelligent batching
 * @purpose Retrieve category information with batch processing and concurrency control
 * @param {Set} categoryIds - Set of unique category IDs to fetch
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Object>} Map of category ID to category data
 * @usedBy enrichProductsWithCategories
 */
async function fetchCategoryDataInBatches(categoryIds, config, params) {
  const categoryMap = {};

  if (!categoryIds || categoryIds.size === 0) {
    return categoryMap;
  }

  const batchSize = config.commerce.batching.categories || 20;
  const requestDelay = config.performance.batching.requestDelay || 100;
  const maxConcurrent = config.performance.batching.maxConcurrent || 15;

  const categoryArray = Array.from(categoryIds);

  // Process in batches with configurable concurrency
  for (let i = 0; i < categoryArray.length; i += batchSize) {
    const batch = categoryArray.slice(i, i + batchSize);

    // Limit concurrent requests per batch
    const chunks = [];
    for (let j = 0; j < batch.length; j += maxConcurrent) {
      chunks.push(batch.slice(j, j + maxConcurrent));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const categoryPromises = chunk.map(async (categoryId) => {
        try {
          const response = await executeAdminTokenCommerceRequest(
            `/categories/${categoryId}`,
            { method: 'GET' },
            config,
            params
          );

          if (response.body) {
            categoryMap[categoryId] = {
              id: response.body.id,
              name: response.body.name,
              parent_id: response.body.parent_id,
              level: response.body.level,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}: ${error.message}`);
          categoryMap[categoryId] = { id: categoryId, name: 'Unknown Category' };
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
 * Fetch inventory data from Commerce API with intelligent batching
 * @purpose Retrieve inventory information with batch processing and concurrency control
 * @param {Array} skus - Array of SKUs to fetch inventory for
 * @param {Object} config - Configuration object with Commerce settings
 * @param {Object} params - Action parameters with credentials
 * @returns {Promise<Object>} Map of SKU to inventory data
 * @usedBy enrichProductsWithInventory
 */
async function fetchInventoryDataInBatches(skus, config, params) {
  const inventoryMap = {};

  if (!skus || skus.length === 0) {
    return inventoryMap;
  }

  const batchSize = config.commerce.batching.inventory || 20;
  const requestDelay = config.performance.batching.requestDelay || 100;
  const maxConcurrent = config.performance.batching.maxConcurrent || 15;

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
          const response = await executeAdminTokenCommerceRequest(
            `/stockItems/${sku}`,
            { method: 'GET' },
            config,
            params
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
      .map((id) => categoryMap[String(id)])
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
  fetchCategoryDataInBatches,
  fetchInventoryDataInBatches,

  // Feature utilities (building blocks)
  applyCategoriesToProducts,
  applyInventoryToProducts,
  validateEnrichmentParameters,
};
