/**
 * Adobe Commerce Product Enrichment Module
 * Orchestrates category and inventory data enrichment following Adobe standards
 */

const { extractCategoryIds, fetchCategoriesBatch } = require('./categories');
const { createInventoryBatches } = require('./inventory');

/**
 * Create category fetch promise using batch endpoint
 * @param {Set} categoryIds - Set of category IDs
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Array} Array with single batch promise
 */
function createCategoryPromises(categoryIds, config, bearerToken) {
  if (categoryIds.size === 0) {
    return [];
  }

  const { baseUrl, api } = config.commerce;
  return [fetchCategoriesBatch(Array.from(categoryIds), bearerToken, baseUrl, api)];
}

/**
 * Create lookup maps from fetched data for performance
 * @param {Array} allInventory - Flattened inventory results
 * @param {Array} categoryResults - Category fetch results
 * @returns {Object} Object with inventoryMap and categoryMap
 */
function createLookupMaps(allInventory, categoryResults) {
  const inventoryMap = new Map();
  const categoryMap = new Map();

  allInventory.forEach((inv) => {
    if (inv.product_id) {
      inventoryMap.set(inv.product_id, inv);
    }
  });

  categoryResults.forEach((cat) => {
    if (cat && cat.id) {
      // Ensure both string and number keys are handled
      categoryMap.set(cat.id.toString(), cat);
      categoryMap.set(cat.id, cat);
    }
  });

  return { inventoryMap, categoryMap };
}

/**
 * Enrich a single product with category and inventory data
 * @param {Object} product - Base product data
 * @param {Map} categoryMap - Category lookup map
 * @param {Map} inventoryMap - Inventory lookup map
 * @param {Object} config - Configuration object
 * @returns {Object} Enriched product
 */
function enrichSingleProduct(product, categoryMap, inventoryMap, config) {
  const enriched = { ...product };

  // Add category data from extension_attributes.category_links with fetched names
  if (product.extension_attributes && product.extension_attributes.category_links) {
    enriched.categories = product.extension_attributes.category_links.map((link) => {
      // Try both string and number versions of the category ID
      const categoryInfo =
        categoryMap.get(link.category_id) || categoryMap.get(link.category_id.toString());
      return {
        id: link.category_id,
        name: categoryInfo ? categoryInfo.name : `Category ${link.category_id}`,
        position: link.position,
      };
    });
  } else {
    enriched.categories = [];
  }

  // Add inventory data
  const inventory = inventoryMap.get(product.id);
  if (inventory) {
    enriched.qty = inventory.qty || 0;
    enriched.stock_status = inventory.is_in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK';
  } else {
    enriched.qty = 0;
    enriched.stock_status = 'OUT_OF_STOCK';
  }

  // Ensure images array exists
  if (!enriched.images && product.media_gallery_entries) {
    enriched.images = product.media_gallery_entries.map((entry) => ({
      url: entry.file ? `${config.commerce.baseUrl}/media/catalog/product${entry.file}` : '',
    }));
  } else if (!enriched.images) {
    enriched.images = [];
  }

  return enriched;
}

/**
 * Enrich products with categories and inventory data with optional caching
 * @param {Array} products - Base product data
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @param {Object} cache - Cache instance (optional)
 * @param {Object} logger - Logger instance (optional)
 * @returns {Promise<Array>} Enriched products
 */
async function enrichProducts(products, config, bearerToken, cache = null, logger = null) {
  const categoryIds = extractCategoryIds(products);
  const inventoryPromises = createInventoryBatches(products, config, bearerToken);
  const totalInventoryBatches = inventoryPromises.length; // Track total batches needed
  const categoryPromises = createCategoryPromises(categoryIds, config, bearerToken);
  let categoryResults = [];
  let inventoryResults = [];
  let cacheHits = 0;
  let actualCategoryApiCalls = 0;
  let actualInventoryApiCalls = 0;

  // Fetch categories with caching
  if (categoryPromises.length > 0 && cache) {
    const categoryIds = Array.from(extractCategoryIds(products));
    const cacheKey = { categoryIds };
    const cachedCategories = await cache.get('categories', cacheKey, bearerToken);

    if (cachedCategories) {
      // Cached categories are already flattened, wrap in array for consistency
      categoryResults = [cachedCategories];
      cacheHits++;
      if (logger) logger.info('Categories cache HIT');
    } else {
      categoryResults = await Promise.all(categoryPromises);
      actualCategoryApiCalls = categoryPromises.length;
      if (categoryResults.length > 0) {
        // Flatten and cache all category results as a single array
        const flattenedCategories = categoryResults.flat();
        await cache.put('categories', cacheKey, bearerToken, flattenedCategories);
      }
      if (logger) logger.info('Categories cache MISS');
    }
  } else if (categoryPromises.length > 0) {
    categoryResults = await Promise.all(categoryPromises);
    actualCategoryApiCalls = categoryPromises.length;
  }

  // Fetch inventory with caching
  if (inventoryPromises.length > 0 && cache) {
    const skus = products.map((p) => p.sku);
    const cacheKey = { skus };
    const cachedInventory = await cache.get('inventory', cacheKey, bearerToken);

    if (cachedInventory) {
      // Cached inventory is already flattened, wrap it in array for consistency
      inventoryResults = [cachedInventory];
      cacheHits++;
      if (logger) {
        logger.info('Inventory cache HIT');
        logger.info('Cached inventory structure', {
          isArray: Array.isArray(cachedInventory),
          length: cachedInventory.length,
        });
      }
    } else {
      inventoryResults = await Promise.all(inventoryPromises);
      actualInventoryApiCalls = inventoryPromises.length;
      if (logger) {
        logger.info('Inventory cache MISS');
        logger.info('Storing inventory in cache', {
          batchCount: inventoryResults.length,
          firstBatchLength: inventoryResults[0]?.length,
          totalItems: inventoryResults.flat().length,
        });
      }
      if (inventoryResults.length > 0) {
        // Flatten and cache all inventory results as a single array
        const flattenedInventory = inventoryResults.flat();
        await cache.put('inventory', cacheKey, bearerToken, flattenedInventory);
      }
    }
  } else if (inventoryPromises.length > 0) {
    inventoryResults = await Promise.all(inventoryPromises);
    actualInventoryApiCalls = inventoryPromises.length;
  }

  const allInventory = inventoryResults.flat();
  const allCategories = categoryResults.flat();
  const { inventoryMap, categoryMap } = createLookupMaps(allInventory, allCategories);

  const enrichedProducts = products.map((product) =>
    enrichSingleProduct(product, categoryMap, inventoryMap, config)
  );
  return {
    products: enrichedProducts,
    apiCalls: actualCategoryApiCalls + actualInventoryApiCalls, // Use actual API calls, not promise counts
    categoriesApiCalls: actualCategoryApiCalls,
    inventoryApiCalls: actualInventoryApiCalls,
    totalInventoryBatches, // Total inventory batches (for metrics display)
    cacheHits,
  };
}

module.exports = {
  enrichProducts,
};
