/**
 * Adobe Commerce Product Enrichment Module
 * Handles category and inventory data enrichment following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

/**
 * Extract unique category IDs from products
 * @param {Array} products - Array of products
 * @returns {Set} Set of unique category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();
  products.forEach((product) => {
    if (product.extension_attributes && product.extension_attributes.category_links) {
      product.extension_attributes.category_links.forEach((link) => {
        categoryIds.add(link.category_id);
      });
    }
  });
  return categoryIds;
}

/**
 * Create batched inventory fetch promises
 * @param {Array} products - Array of products
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Array} Array of inventory fetch promises
 */
function createInventoryBatches(products, config, bearerToken) {
  const { batching, baseUrl, api } = config.commerce;
  const inventoryPromises = [];
  for (let i = 0; i < products.length; i += batching.inventory) {
    const batch = products.slice(i, i + batching.inventory);
    inventoryPromises.push(fetchInventoryForProducts(batch, bearerToken, baseUrl, api));
  }
  return inventoryPromises;
}

/**
 * Create category fetch promises for unique category IDs
 * @param {Set} categoryIds - Set of category IDs
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Array} Array of category fetch promises
 */
function createCategoryPromises(categoryIds, config, bearerToken) {
  const { baseUrl, api } = config.commerce;
  return Array.from(categoryIds).map((categoryId) =>
    fetchCategoryById(categoryId, bearerToken, baseUrl, api)
  );
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
 * Enrich products with categories and inventory data
 * @param {Array} products - Base product data
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Promise<Array>} Enriched products
 */
async function enrichProducts(products, config, bearerToken) {
  // Configuration destructuring moved to where values are used for better performance

  // Step 1: Extract unique category IDs from all products
  const categoryIds = extractCategoryIds(products);

  // Step 2: Create batched inventory and category fetch promises
  const inventoryPromises = createInventoryBatches(products, config, bearerToken);
  const categoryPromises = createCategoryPromises(categoryIds, config, bearerToken);

  // Step 3: Fetch all enrichment data in parallel
  const [inventoryResults, categoryResults] = await Promise.all([
    Promise.all(inventoryPromises),
    Promise.all(categoryPromises),
  ]);

  // Step 4: Process results and create lookup maps
  const allInventory = inventoryResults.flat();
  const { inventoryMap, categoryMap } = createLookupMaps(allInventory, categoryResults);

  // Step 5: Enrich each product using lookup maps
  const enrichedProducts = products.map((product) =>
    enrichSingleProduct(product, categoryMap, inventoryMap, config)
  );

  // Step 6: Return enriched products with API call metrics
  return {
    products: enrichedProducts,
    apiCalls: categoryPromises.length + inventoryPromises.length,
    categoriesApiCalls: categoryPromises.length,
    inventoryApiCalls: inventoryPromises.length,
  };
}

/**
 * Fetch category by ID
 * @param {string} categoryId - Category ID
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object|null>} Category data
 */
async function fetchCategoryById(categoryId, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-enrichment');
  const url = `${baseUrl}/rest/${api.version}/categories/${categoryId}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!response.ok) {
      log.warn('Category fetch failed', { categoryId, status: response.status });
      return null;
    }

    const category = await response.json();
    return {
      id: category.id,
      name: category.name,
      level: category.level,
      path: category.path,
    };
  } catch (error) {
    log.warn('Category fetch error', { categoryId, error: error.message });
    return null;
  }
}

/**
 * Fetch inventory for a batch of products
 * @param {Array} products - Product batch
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Array>} Inventory data
 */
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api, logger = null) {
  const log = logger || Core.Logger('commerce-enrichment');

  const inventoryPromises = products.map(async (product) => {
    const url = `${baseUrl}/rest/${api.version}/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=${product.sku}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      if (!response.ok) {
        log.warn('Inventory fetch failed', { sku: product.sku, status: response.status });
        return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
      }

      const result = await response.json();
      const sourceItems = result.items || [];

      // Sum quantities from all source items for this SKU
      const totalQty = sourceItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const isInStock = sourceItems.some((item) => item.status === 1); // 1 = enabled/in stock

      return {
        product_id: product.id,
        sku: product.sku,
        qty: totalQty,
        is_in_stock: isInStock,
      };
    } catch (error) {
      log.warn('Inventory fetch error', { sku: product.sku, error: error.message });
      return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
    }
  });

  return await Promise.all(inventoryPromises);
}

module.exports = {
  enrichProducts,
  extractCategoryIds,
  createInventoryBatches,
  createCategoryPromises,
  createLookupMaps,
  enrichSingleProduct,
  fetchCategoryById,
  fetchInventoryForProducts,
};
