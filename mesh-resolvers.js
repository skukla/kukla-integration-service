/** METADATA: {"templateHash":"f70238cfc1afe302ba08493908e8d9c09956bfa0ec9ac862920e4ff62f7cdbc0","configHash":"2f225d61987d2cdb6e77594ba88dcdfb0ca0d115c87f7625ef5de06735919e78","generatedAt":"2025-07-22T17:37:43.686Z","version":"1.0.0"} */
/**
 * API Mesh Resolver - Optimized Implementation
 *
 * Simplified resolver focused on performance and minimal data fetching.
 * Removes over-engineering while maintaining functionality.
 */

// ============================================================================
// CORE RESOLVER FUNCTIONS - Simplified approach
// ============================================================================

/**
 * Robust category ID extraction (inlined from src/products/utils/data.js)
 * Handles multiple data sources and formats
 */
function getCategoryIds(product) {
  const categoryIds = [];

  // Check direct categories array first
  if (product.categories && Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      if (cat.id) {
        categoryIds.push(parseInt(cat.id));
      }
      // Also check if categories are just strings (category IDs)
      if (typeof cat === 'string' || typeof cat === 'number') {
        const categoryId = parseInt(cat);
        if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
          categoryIds.push(categoryId);
        }
      }
    });
  }

  // Check custom_attributes for category_ids
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    const categoryAttr = product.custom_attributes.find(
      (attr) => attr.attribute_code === 'category_ids'
    );
    if (categoryAttr && categoryAttr.value) {
      // Handle different value types
      let catIds = [];
      if (typeof categoryAttr.value === 'string') {
        catIds = categoryAttr.value.split(',');
      } else if (Array.isArray(categoryAttr.value)) {
        catIds = categoryAttr.value.map(String);
      } else {
        catIds = [String(categoryAttr.value)];
      }

      catIds.forEach((id) => {
        const categoryId = parseInt(String(id).trim());
        if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
          categoryIds.push(categoryId);
        }
      });
    }
  }

  // Check extension_attributes for category_links
  if (
    product.extension_attributes &&
    product.extension_attributes.category_links &&
    Array.isArray(product.extension_attributes.category_links)
  ) {
    product.extension_attributes.category_links.forEach((link) => {
      if (link.category_id) {
        const categoryId = parseInt(link.category_id);
        if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
          categoryIds.push(categoryId);
        }
      }
    });
  }

  return categoryIds;
}

/**
 * Fetches products with minimal selection set
 */
async function fetchProducts(context, info, pageSize = 100) {
  const response = await context.Products.Query.products_list({
    root: {},
    args: { pageSize: pageSize },
    context: context,
    info: info,
    selectionSet: `{
      items {
        sku
        name
        price
        status
        type_id
        created_at
        updated_at
        custom_attributes {
          attribute_code
          value
        }
        extension_attributes {
          category_links {
            category_id
            position
          }
        }
        media_gallery_entries {
          file
          position
          types
        }
      }
      total_count
    }`,
  });

  if (!response?.items || !Array.isArray(response.items)) {
    throw new Error('Failed to fetch products from JsonSchema source');
  }

  return response.items;
}

/**
 * Fetches categories with batch endpoint for better performance
 */
async function fetchCategories(context, info, categoryIds) {
  const result = { categoryMap: new Map(), apiCallsMade: 0, batched: false };

  // Use batch endpoint if available and we have multiple categories
  if (categoryIds.length >= 1) {
    try {
      const batchResponse = await context.Categories.Query.categories_batch({
        root: {},
        args: { categoryIds: categoryIds.join(',') },
        context: context,
        info: info,
        selectionSet: `{
          items {
            id
            name
          }
        }`,
      });

      if (batchResponse?.items) {
        batchResponse.items.forEach((category) => {
          result.categoryMap.set(category.id, category);
        });
      }

      result.apiCallsMade = 1;
      result.batched = true;
      return result;
    } catch (error) {
      console.warn('Batch categories failed, falling back to individual calls:', error.message);
      // Fall back to individual calls if batch fails
    }
  }

  // Fallback to individual calls for single items or if batch fails
  const categoryPromises = categoryIds.map((categoryId) =>
    context.Categories.Query.category_info({
      root: {},
      args: { categoryId: categoryId },
      context: context,
      info: info,
      selectionSet: `{
        id
        name
      }`,
    })
  );

  const responses = await Promise.allSettled(categoryPromises);

  responses.forEach((response, index) => {
    if (response.status === 'fulfilled' && response.value) {
      const categoryId = categoryIds[index];
      result.categoryMap.set(categoryId, response.value);
      result.apiCallsMade++;
    }
  });

  return result;
}

/**
 * Fetches inventory using batch calls when possible, individual calls as fallback
 */
async function fetchInventory(context, info, skus) {
  const result = { inventoryMap: new Map(), apiCallsMade: 0, batched: false };

  // Use batch endpoint if available and we have multiple SKUs
  if (skus.length >= 1) {
    try {
      const batchResponse = await context.Inventory.Query.inventory_batch({
        root: {},
        args: { skus: skus.join(',') },
        context: context,
        info: info,
        selectionSet: `{
          items {
            sku
            qty
            is_in_stock
          }
        }`,
      });

      if (batchResponse?.items) {
        batchResponse.items.forEach((item) => {
          result.inventoryMap.set(item.sku, {
            qty: item.qty || 0,
            is_in_stock: item.is_in_stock || false,
          });
        });
      }

      result.apiCallsMade = 1;
      result.batched = true;
      return result;
    } catch (error) {
      console.warn('Batch inventory failed, falling back to individual calls:', error.message);
      // Fall back to individual calls if batch fails
    }
  }

  // Fallback to individual stockItems calls
  const inventoryPromises = skus.map((sku) =>
    context.Inventory.Query.inventory_items({
      root: {},
      args: { sku: sku },
      context: context,
      info: info,
      selectionSet: `{
        sku
        qty
        is_in_stock
      }`,
    })
  );

  const responses = await Promise.allSettled(inventoryPromises);

  responses.forEach((response, index) => {
    if (response.status === 'fulfilled' && response.value) {
      const sku = skus[index];
      result.inventoryMap.set(sku, {
        qty: response.value.qty || 0,
        is_in_stock: response.value.is_in_stock || false,
      });
      result.apiCallsMade++;
    }
  });

  return result;
}

/**
 * Enriches products with category and inventory data
 */
function enrichProducts(products, categoryMap, inventoryMap) {
  return products.map((product) => {
    const inventory = inventoryMap.get(product.sku) || { qty: 0, is_in_stock: false };

    // Extract category objects using robust logic
    const categories = [];
    const categoryIds = getCategoryIds(product);
    categoryIds.forEach((id) => {
      const category = categoryMap.get(id);
      if (category) {
        categories.push(category);
      }
    });

    return {
      ...product,
      qty: inventory.qty,
      categories: categories,
      inventory: {
        qty: inventory.qty,
        is_in_stock: inventory.is_in_stock,
      },
    };
  });
}

/**
 * Calculates performance metrics with native mesh optimization awareness
 */
function calculatePerformance(
  startTime,
  productCount,
  categoryCount,
  inventoryCount,
  batchInfo = {}
) {
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Use actual API calls made (not assumptions)
  const categoriesApiCalls = batchInfo.categoriesApiCalls || 0;
  const inventoryApiCalls = batchInfo.inventoryApiCalls || 0;
  const totalApiCalls = 1 + categoriesApiCalls + inventoryApiCalls;

  return {
    processedProducts: productCount,
    apiCalls: 1, // CLIENT API CALLS - Single GraphQL query to mesh
    method: 'API Mesh', // Must match frontend detection logic
    executionTime: totalTime,
    totalTime: totalTime,
    productsApiCalls: 1,
    categoriesApiCalls: categoriesApiCalls,
    inventoryApiCalls: inventoryApiCalls,
    totalApiCalls: totalApiCalls, // INTERNAL API CALLS - Commerce API calls made by mesh
    uniqueCategories: categoryCount,
    productCount: productCount,
    clientCalls: 1,
    dataSourcesUnified: totalApiCalls, // API ENDPOINTS - Total internal calls for frontend display
    // Enhanced cache and batch metrics
    cacheHitRate: 0.0, // Native caching will populate this
    categoriesCached: 0, // Categories served from cache
    categoriesFetched: categoryCount,
    dataFreshness: 'Live', // Will show 'Cached' when cache is hit
    meshOptimizations: [
      'Single GraphQL Query',
      batchInfo.categoriesBatched ? 'Categories Batched' : 'Categories Individual',
      batchInfo.inventoryBatched ? 'Inventory Batched' : 'Inventory Individual (per-SKU calls)',
    ].join(', '),
    batchOptimizations: {
      categoriesBatched: batchInfo.categoriesBatched || false,
      inventoryBatched: batchInfo.inventoryBatched || false, // Can now be batched!
      apiCallsReduced: Math.max(
        0,
        categoryCount - categoriesApiCalls + (inventoryCount - inventoryApiCalls) // Both categories and inventory can be optimized
      ),
    },
  };
}

// ============================================================================
// RESOLVERS - Simplified resolver definitions
// ============================================================================

module.exports = {
  resolvers: {
    Query: {
      /**
       * Main resolver for enriched products
       */
      mesh_products_enriched: {
        resolve: async (parent, args, context, info) => {
          try {
            const startTime = Date.now();

            // Step 1: Fetch products
            const products = await fetchProducts(context, info, args.pageSize);

            // Step 2: Extract metadata
            const categoryIds = new Set();
            const skus = [];

            products.forEach((product) => {
              if (product.sku) {
                skus.push(product.sku);
              }

              // Extract category IDs using robust logic
              const productCategoryIds = getCategoryIds(product);
              productCategoryIds.forEach((id) => categoryIds.add(id));
            });

            // Step 3: Fetch categories and inventory in parallel with batch optimization
            const categoryIdsArray = Array.from(categoryIds);
            const skusArray = skus;

            const [categoryResult, inventoryResult] = await Promise.all([
              fetchCategories(context, info, categoryIdsArray),
              fetchInventory(context, info, skusArray),
            ]);

            // Step 4: Enrich products
            const enrichedProducts = enrichProducts(
              products,
              categoryResult.categoryMap,
              inventoryResult.inventoryMap
            );

            // Step 5: Calculate performance with actual API call data
            const batchInfo = {
              categoriesBatched: categoryResult.batched,
              inventoryBatched: inventoryResult.batched,
              categoriesApiCalls: categoryResult.apiCallsMade,
              inventoryApiCalls: inventoryResult.apiCallsMade,
            };

            const performance = calculatePerformance(
              startTime,
              enrichedProducts.length,
              categoryResult.categoryMap.size,
              inventoryResult.inventoryMap.size,
              batchInfo
            );

            return {
              products: enrichedProducts,
              total_count: enrichedProducts.length,
              message: `Successfully enriched ${enrichedProducts.length} products with category and inventory data using native mesh optimizations`,
              performance: performance,
            };
          } catch (error) {
            console.error('Mesh resolver error:', error);

            return {
              products: [],
              total_count: 0,
              message: `Error in mesh resolver: ${error.message}`,
              performance: {
                processedProducts: 0,
                apiCalls: 0,
                method: 'API Mesh Custom Resolver (Error)',
                executionTime: 0,
                totalTime: 0,
                productsApiCalls: 0,
                categoriesApiCalls: 0,
                inventoryApiCalls: 0,
                totalApiCalls: 0,
                uniqueCategories: 0,
                productCount: 0,
                clientCalls: 0,
                meshOptimizations: 'Error - No optimizations applied',
                batchOptimizations: {
                  categoriesBatched: false,
                  inventoryBatched: false,
                  apiCallsReduced: 0,
                },
              },
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },

      /**
       * Basic products resolver (no enrichment)
       */
      mesh_products_basic: {
        resolve: async (parent, args, context, info) => {
          try {
            const products = await fetchProducts(context, info);

            return {
              products: products,
              total_count: products.length,
              message: `Fetched ${products.length} basic products`,
            };
          } catch (error) {
            console.error('mesh_products_basic resolver error:', error);

            return {
              products: [],
              total_count: 0,
              message: `Error in basic products resolver: ${error.message}`,
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },

      /**
       * Categories resolver with dynamic ID extraction
       */
      mesh_categories: {
        resolve: async (parent, args, context, info) => {
          try {
            // Get category IDs from query args or fetch from products
            let categoryIds = [];

            if (args.categoryIds && Array.isArray(args.categoryIds)) {
              categoryIds = args.categoryIds;
            } else {
              // Fallback: extract category IDs from all products
              const products = await fetchProducts(context, info);
              const categoryIdSet = new Set();
              products.forEach((product) => {
                const productCategoryIds = getCategoryIds(product);
                productCategoryIds.forEach((id) => categoryIdSet.add(id));
              });
              categoryIds = Array.from(categoryIdSet).slice(0, 10); // Limit to first N for performance
            }

            const categoryResult = await fetchCategories(context, info, categoryIds);
            const categories = Array.from(categoryResult.categoryMap.values());

            return {
              categories: categories,
              total_count: categories.length,
              message: `Fetched ${categories.length} categories`,
            };
          } catch (error) {
            console.error('mesh_categories resolver error:', error);

            return {
              categories: [],
              total_count: 0,
              message: `Error in categories resolver: ${error.message}`,
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                timestamp: new Date().toISOString(),
              },
            };
          }
        },
      },
    },
  },
};
