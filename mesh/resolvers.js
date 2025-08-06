/**
 * API Mesh Resolver - Simplified Implementation
 * Focused on essential functionality only
 */

// GraphQL query fragments (inlined during build - API Mesh doesn't support require())
const QUERIES = {
  productsList:
    '{\n  items {\n    sku\n    name\n    price\n    status\n    type_id\n    created_at\n    updated_at\n    custom_attributes {\n      attribute_code\n      value\n    }\n    extension_attributes {\n      category_links {\n        category_id\n        position\n      }\n    }\n    media_gallery_entries {\n      file\n      position\n      types\n    }\n  }\n  total_count\n}',
  categoriesBatch: '{\n  items {\n    id\n    name\n  }\n}',
  inventoryBatch: '{\n  items {\n    sku\n    quantity\n    status\n  }\n}',
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
async function fetchProducts(context, pageSize) {
  const response = await context.Products.Query.products_list({
    root: {},
    args: { pageSize },
    context,
    selectionSet: QUERIES.productsList,
  });

  if (!response?.items) {
    throw new Error('Failed to fetch products');
  }

  return response.items;
}

/**
 * Fetch categories using batch endpoint
 */
async function fetchCategories(context, categoryIds) {
  if (categoryIds.length === 0) {
    return new Map();
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

  return categoryMap;
}

/**
 * Fetch inventory using batch endpoint
 */
async function fetchInventory(context, skus) {
  if (skus.length === 0) {
    return new Map();
  }

  const response = await context.Inventory.Query.inventory_batch({
    root: {},
    args: { skus: skus.join(',') },
    context,
    selectionSet: QUERIES.inventoryBatch,
  });

  const inventoryMap = new Map();
  if (response?.items) {
    response.items.forEach((item) => {
      inventoryMap.set(item.sku, {
        qty: parseFloat(item.quantity) || 0,
        is_in_stock: item.status === 1,
      });
    });
  }

  return inventoryMap;
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
      inventory: {
        quantity: inventory.qty,
        is_in_stock: inventory.is_in_stock,
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

            // Fetch products
            const products = await fetchProducts(context, args.pageSize);

            // Extract category IDs and SKUs
            const categoryIds = new Set();
            const skus = [];

            products.forEach((product) => {
              skus.push(product.sku);
              getCategoryIds(product).forEach((id) => categoryIds.add(id));
            });

            // Fetch categories and inventory in parallel
            const [categoryMap, inventoryMap] = await Promise.all([
              fetchCategories(context, Array.from(categoryIds)),
              fetchInventory(context, skus),
            ]);

            // Enrich products
            const enrichedProducts = enrichProducts(products, categoryMap, inventoryMap);

            // Simple performance metrics
            const executionTime = Date.now() - startTime;

            return {
              products: enrichedProducts,
              total_count: enrichedProducts.length,
              message: `Successfully enriched ${enrichedProducts.length} products`,
              performance: {
                method: 'API Mesh',
                productCount: enrichedProducts.length,
                executionTime,
                apiCalls: 1,
                dataSourcesUnified: 3,
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
