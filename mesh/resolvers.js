/**
 * API Mesh Resolver - Simplified Implementation
 * Focused on essential functionality only
 */

// GraphQL query fragments (inlined during build - API Mesh doesn't support require())
const QUERIES = {
  productsList: "{\n  items {\n    sku\n    name\n    price\n    status\n    type_id\n    created_at\n    updated_at\n    custom_attributes {\n      attribute_code\n      value\n    }\n    extension_attributes {\n      category_links {\n        category_id\n        position\n      }\n    }\n    media_gallery_entries {\n      file\n      types\n    }\n  }\n  total_count\n}",
  categoriesBatch: "{\n  items {\n    id\n    name\n  }\n}",
  inventoryBatch: "{\n  items {\n    sku\n    quantity\n    status\n  }\n}",
};

/**
 * Extract category IDs from Commerce product extension_attributes
 */
function getCategoryIds(product) {
  const categoryIds = [];
  
  // Commerce API provides category IDs via extension_attributes.category_links
  if (product.extension_attributes?.category_links?.length) {
    product.extension_attributes.category_links.forEach((link) => {
      if (link.category_id) {
        categoryIds.push(parseInt(link.category_id));
      }
    });
  }
  
  return categoryIds;
}

/**
 * Fetch products from Commerce API
 */
async function fetchProducts(context, pageSize, currentPage) {
  const response = await context.Products.Query.products_list({
    root: {},
    args: { pageSize, currentPage },
    context,
    selectionSet: QUERIES.productsList,
  });

  if (!response?.items) {
    throw new Error('Failed to fetch products');
  }

  return {
    items: response.items,
    total_count: response.total_count || 0
  };
}

/**
 * Fetch categories using batch endpoint
 */
async function fetchCategories(context, categoryIds) {
  if (categoryIds.length === 0) {
    return { categoryMap: new Map(), apiCalls: 0 };
  }

  const response = await context.Categories.Query.categories_batch({
    root: {},
    args: { categoryIds: categoryIds.join(',') },
    context,
    selectionSet: QUERIES.categoriesBatch,
  });

  const categoryMap = new Map();
  if (response?.items) {
    response.items.forEach((category) => {
      categoryMap.set(category.id, category);
    });
  }

  return { categoryMap, apiCalls: 1 };
}

/**
 * Fetch inventory using parallel batch processing for better performance
 */
async function fetchInventory(context, skus) {
  if (skus.length === 0) {
    return { inventoryMap: new Map(), apiCalls: 0 };
  }

  const batchSize = 50; // Match Commerce API pageSize limit
  const inventoryMap = new Map();
  
  // Create promises for all batches
  const batchPromises = [];
  for (let i = 0; i < skus.length; i += batchSize) {
    const batchSkus = skus.slice(i, i + batchSize);
    
    const promise = context.Inventory.Query.inventory_batch({
      root: {},
      args: { skus: batchSkus.join(',') },
      context,
      selectionSet: QUERIES.inventoryBatch,
    });
    
    batchPromises.push(promise);
  }
  
  // Fetch all batches in parallel
  const batchResults = await Promise.all(batchPromises);
  const apiCalls = batchPromises.length;
  
  // Process all batch results
  batchResults.forEach(response => {
    if (response?.items) {
      response.items.forEach((item) => {
        inventoryMap.set(item.sku, {
          qty: parseFloat(item.quantity) || 0,
          is_in_stock: item.status === 1,
        });
      });
    }
  });

  return { inventoryMap, apiCalls };
}

/**
 * Enrich products with categories and inventory
 */
function enrichProducts(products, categoryMap, inventoryMap) {
  return products.map((product) => {
    // Get inventory data
    const inventory = inventoryMap.get(product.sku) || { qty: 0, is_in_stock: false };

    // Get category data
    const categories = [];
    const categoryIds = getCategoryIds(product);
    categoryIds.forEach((id) => {
      const category = categoryMap.get(id);
      if (category) {
        categories.push(category);
      }
    });

    // Extract url_key from custom_attributes
    const urlKeyAttr = product.custom_attributes?.find((attr) => attr.attribute_code === 'url_key');
    const url_key = urlKeyAttr?.value || '';

    // Enrich media URLs
    const enrichedMedia = product.media_gallery_entries
      ? product.media_gallery_entries.map((entry) => {
          let url = '';
          if (entry.file?.startsWith('http')) {
            url = entry.file; // Already full URL
          } else if (entry.file) {
            url = 'https://citisignal-com774.adobedemo.com/media/catalog/product' + entry.file;
          }
          return { ...entry, url };
        })
      : [];

    return {
      ...product,
      url_key,
      inventory: {
        quantity: Number(inventory.qty) || 0,
      },
      categories,
      media_gallery_entries: enrichedMedia,
    };
  });
}

module.exports = {
  resolvers: {
    Query: {
      /**
       * Main resolver for enriched products
       */
      mesh_products_enriched: {
        resolve: async (parent, args, context) => {
          try {
            const startTime = Date.now();

            // Use external pagination - return only the requested page
            const pageSize = args.pageSize || 50;
            const currentPage = args.currentPage || 1;

            // Fetch only the requested page of products
            const productsResult = await fetchProducts(context, pageSize, currentPage);
            const allProducts = productsResult.items;
            const totalCount = productsResult.total_count;

            // Extract category IDs and SKUs from all products
            const categoryIds = new Set();
            const skus = [];

            allProducts.forEach((product) => {
              skus.push(product.sku);
              getCategoryIds(product).forEach((id) => categoryIds.add(id));
            });

            // Fetch categories and inventory in parallel
            const [categoryResult, inventoryResult] = await Promise.all([
              fetchCategories(context, Array.from(categoryIds)),
              fetchInventory(context, skus),
            ]);

            // Enrich products
            const enrichedProducts = enrichProducts(allProducts, categoryResult.categoryMap, inventoryResult.inventoryMap);

            // Calculate metrics
            const executionTime = Date.now() - startTime;
            
            // Count Mesh operations (not actual API calls - Mesh handles caching internally)
            const productsOperations = 1; // Always 1 products fetch
            const categoriesOperations = categoryResult.apiCalls; // 0 or 1 depending on if categories exist
            const inventoryOperations = inventoryResult.apiCalls; // Number of inventory batches
            const totalOperations = productsOperations + categoriesOperations + inventoryOperations;

            return {
              products: enrichedProducts,
              total_count: totalCount,
              message: "Successfully enriched " + enrichedProducts.length + " products (page " + currentPage + ")",
              performance: {
                method: 'API Mesh',
                productCount: enrichedProducts.length,
                executionTime,
                apiCalls: totalOperations, // These are Mesh operations, not actual API calls
                dataSourcesUnified: 3,
                // Mesh operation counts (not actual backend API calls)
                productsApiCalls: productsOperations, // Keeping field name for compatibility
                categoriesApiCalls: categoriesOperations,
                inventoryApiCalls: inventoryOperations,
                // Note: Actual API calls and caching are handled internally by Mesh
              },
            };
          } catch (error) {
            console.error('Mesh resolver error:', error);
            return {
              products: [],
              total_count: 0,
              message: `Error: ${error.message}`,
              performance: {
                method: 'API Mesh (Error)',
                productCount: 0,
                executionTime: 0,
                apiCalls: 0,
                dataSourcesUnified: 0,
              },
            };
          }
        },
      },
    },
  },
};