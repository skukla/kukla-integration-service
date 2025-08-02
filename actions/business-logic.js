/**
 * Simplified Business Logic for Adobe App Builder
 * Essential business functions extracted from over-engineered infrastructure
 */

const { buildCommerceUrl, fetchCommerceData } = require('./utils');

/**
 * Fetch and enrich products from Adobe Commerce
 * Uses admin token authentication and enriches with categories/inventory
 *
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of enriched products
 */
async function fetchAndEnrichProducts(params, config) {
  try {
    // Step 1: Get admin token
    const bearerToken = await getAdminToken(config, params);

    // Step 2: Fetch products from Commerce API
    const products = await fetchProducts(bearerToken, config);

    // Step 3: Enrich products with categories and inventory
    const enrichedProducts = await enrichProducts(products, bearerToken, config);

    return enrichedProducts;
  } catch (error) {
    throw new Error(`Commerce API integration failed: ${error.message}`);
  }
}

/**
 * Get admin token for Commerce API authentication
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<string>} Bearer token
 */
async function getAdminToken(config, params) {
  const { baseUrl, api } = config.commerce;

  if (!params.COMMERCE_ADMIN_USERNAME || !params.COMMERCE_ADMIN_PASSWORD) {
    throw new Error('Commerce admin credentials not provided');
  }

  const tokenUrl = `${baseUrl}/rest/${api.version}${api.paths.adminToken}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: params.COMMERCE_ADMIN_USERNAME,
      password: params.COMMERCE_ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    let errorDetails = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      errorDetails += ` - ${errorBody}`;
    } catch (e) {
      // If we can't read the error body, just use status
    }
    throw new Error(`Token request failed: ${errorDetails}`);
  }

  const token = await response.json();
  return token.replace(/"/g, ''); // Remove quotes from token
}

/**
 * Fetch products from Commerce API
 * @param {string} bearerToken - Admin bearer token
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of products
 */
async function fetchProducts(bearerToken, config) {
  const { baseUrl, api } = config.commerce;
  const productsUrl = `${baseUrl}/rest/${api.version}${api.paths.products}?searchCriteria[pageSize]=100`;
  
  const products = await fetchCommerceData(productsUrl, bearerToken, 'GET', 'Products');
  
  // fetchCommerceData handles empty arrays, but let's ensure we have items
  if (!Array.isArray(products)) {
    throw new Error('Products fetch failed: Invalid response format');
  }
  
  return products;
}

/**
 * Enrich products with categories and inventory data
 * @param {Array} products - Base product data
 * @param {string} bearerToken - Admin bearer token
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Enriched products
 */
async function enrichProducts(products, bearerToken, config) {
  const { baseUrl, api, batching } = config.commerce;

  // Fetch categories and inventory in batches for performance
  const categoryPromises = [];
  const inventoryPromises = [];

  // Batch category fetches
  for (let i = 0; i < products.length; i += batching.categories) {
    const batch = products.slice(i, i + batching.categories);
    categoryPromises.push(fetchCategoriesForProducts(batch, bearerToken, baseUrl, api));
  }

  // Batch inventory fetches
  for (let i = 0; i < products.length; i += batching.inventory) {
    const batch = products.slice(i, i + batching.inventory);
    inventoryPromises.push(fetchInventoryForProducts(batch, bearerToken, baseUrl, api));
  }

  // Wait for all enrichment data
  const [categoryResults, inventoryResults] = await Promise.all([
    Promise.all(categoryPromises),
    Promise.all(inventoryPromises),
  ]);

  // Flatten results
  const allCategories = categoryResults.flat();
  const allInventory = inventoryResults.flat();

  // Create lookup maps for performance
  const categoryMap = new Map();
  const inventoryMap = new Map();

  allCategories.forEach((cat) => {
    if (cat.product_id && cat.category_id) {
      if (!categoryMap.has(cat.product_id)) {
        categoryMap.set(cat.product_id, []);
      }
      categoryMap.get(cat.product_id).push(cat);
    }
  });

  allInventory.forEach((inv) => {
    if (inv.product_id) {
      inventoryMap.set(inv.product_id, inv);
    }
  });

  // Enrich products with the fetched data
  return products.map((product) => {
    const enriched = { ...product };

    // Add category data
    const productCategories = categoryMap.get(product.id) || [];
    enriched.categories = productCategories.map((cat) => ({
      id: cat.category_id,
      name: cat.name || `Category ${cat.category_id}`,
    }));

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
  });
}

/**
 * Fetch categories for a batch of products
 */
async function fetchCategoriesForProducts(products, bearerToken, baseUrl, api) {
  const productIds = products.map((p) => p.id).join(',');
  const url = buildCommerceUrl(baseUrl, api, '/products/categories', { product_id: productIds });
  return await fetchCommerceData(url, bearerToken, 'GET', 'Categories');
}

/**
 * Fetch inventory for a batch of products
 */
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api) {
  const skus = products.map((p) => p.sku).join(',');
  const url = buildCommerceUrl(baseUrl, api, api.paths.stockItems, { product_sku: skus });
  return await fetchCommerceData(url, bearerToken, 'GET', 'Inventory');
}

/**
 * Fetch enriched products from API Mesh
 * Uses GraphQL query to consolidate multiple Commerce API calls
 *
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Mesh response with products and performance data
 */
async function fetchEnrichedProductsFromMesh(config, params) {
  const startTime = Date.now();

  if (!params.API_MESH_ENDPOINT || !params.MESH_API_KEY) {
    throw new Error('API Mesh credentials not provided');
  }

  // Enhanced GraphQL query for enriched product data
  const query = `
    query GetEnrichedProducts($pageSize: Int, $currentPage: Int) {
      products(pageSize: $pageSize, currentPage: $currentPage, search: "") {
        total_count
        items {
          id
          sku
          name
          price_range {
            minimum_price {
              regular_price {
                value
                currency
              }
              final_price {
                value
                currency
              }
            }
          }
          categories {
            id
            name
            level
            path
          }
          media_gallery {
            url
            label
            position
          }
          stock_status
          only_x_left_in_stock
          custom_attributes {
            attribute_code
            value
          }
          created_at
          updated_at
        }
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  `;

  const variables = {
    pageSize: params.pageSize || 100,
    currentPage: params.currentPage || 1,
  };

  try {
    const response = await fetch(params.API_MESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.MESH_API_KEY,
        'User-Agent': 'Adobe-App-Builder/kukla-integration-service',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Mesh API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    const responseTime = Date.now() - startTime;

    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    const productsData = result.data?.products;
    if (!productsData) {
      throw new Error('No products data in mesh response');
    }

    const products = productsData.items || [];

    // Transform mesh response to standardized format
    const transformedProducts = products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price_range?.minimum_price?.regular_price?.value || 0,
      final_price: product.price_range?.minimum_price?.final_price?.value || 0,
      currency: product.price_range?.minimum_price?.regular_price?.currency || 'USD',
      qty: product.only_x_left_in_stock || (product.stock_status === 'IN_STOCK' ? 100 : 0),
      stock_status: product.stock_status,
      categories: product.categories
        ? product.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            level: cat.level,
            path: cat.path,
          }))
        : [],
      images: product.media_gallery
        ? product.media_gallery.map((img) => ({
            url: img.url,
            label: img.label,
            position: img.position,
          }))
        : [],
      custom_attributes: product.custom_attributes || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    return {
      products: transformedProducts,
      performance: {
        productCount: transformedProducts.length,
        totalCount: productsData.total_count,
        meshResponseTime: responseTime,
        pageInfo: productsData.page_info,
        apiCallsConsolidated: calculateConsolidatedCalls(transformedProducts.length),
      },
    };
  } catch (error) {
    const errorTime = Date.now() - startTime;
    throw new Error(`Mesh integration failed after ${errorTime}ms: ${error.message}`);
  }
}

/**
 * Calculate how many individual API calls were consolidated by the mesh
 * This demonstrates the mesh performance benefit
 */
function calculateConsolidatedCalls(productCount) {
  // Without mesh: 1 products call + 1 categories call + 1 inventory call per product
  // With mesh: 1 GraphQL call
  const withoutMesh = 1 + productCount * 2; // products + categories + inventory per product
  const withMesh = 1;

  return {
    withoutMesh,
    withMesh,
    saved: withoutMesh - withMesh,
    efficiency: withoutMesh > 0 ? Math.round(((withoutMesh - withMesh) / withoutMesh) * 100) : 0,
  };
}

/**
 * Build products with standardized transformation
 * Essential business logic preserved from original transformation.js
 *
 * @param {Array} products - Raw product data
 * @returns {Promise<Array>} Transformed products ready for CSV
 */
async function buildProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  try {
    // Standard export fields for CSV transformation

    // Transform each product
    return products.map((product) => {
      const transformed = {};

      // Basic field mapping
      transformed.sku = product.sku || '';
      transformed.name = product.name || '';
      transformed.price = parseFloat(product.price) || 0;
      transformed.qty = parseInt(product.qty, 10) || 0;

      // Category processing
      if (product.categories && Array.isArray(product.categories)) {
        const categoryNames = product.categories.map((cat) => cat.name || cat.id).filter(Boolean);
        transformed.categories = categoryNames.join(', ');
        transformed.category_id = product.categories[0]?.id || '';
      } else {
        transformed.categories = '';
        transformed.category_id = '';
      }

      // Image processing
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        transformed.thumbnail_url = product.images[0].url || '';
        transformed.images = product.images
          .map((img) => img.url)
          .filter(Boolean)
          .join(', ');
      } else {
        transformed.thumbnail_url = '';
        transformed.images = '';
      }

      // Additional CSV fields for RECS format
      transformed.message = product.message || '';
      transformed.value = product.price || 0;
      transformed.page_url = product.page_url || '';
      transformed.inventory = product.qty || 0;
      transformed.margin = product.margin || '';
      transformed.type = product.type || 'product';

      // Custom fields (empty for now)
      const emptyCustoms = Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [`custom${i + 2}`, ''])
      );

      return { ...transformed, ...emptyCustoms };
    });
  } catch (error) {
    throw new Error(`Product transformation failed: ${error.message}`);
  }
}

module.exports = {
  fetchAndEnrichProducts,
  fetchEnrichedProductsFromMesh,
  buildProducts,
};
