/**
 * Adobe Commerce API Integration Module
 * Handles authentication, product fetching, and data enrichment with standardized Adobe patterns
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
    let apiCallCount = 0;

    // Step 1: Get admin token
    const bearerToken = await getAdminToken(params, config);
    apiCallCount += 1; // Token API call

    // Step 2: Fetch products from Commerce API
    const products = await fetchProducts(params, config, bearerToken);
    apiCallCount += 1; // Products API call

    // Step 3: Enrich products with categories and inventory
    const enrichmentResult = await enrichProducts(products, params, config, bearerToken);
    apiCallCount += enrichmentResult.apiCalls; // Category + inventory API calls

    return {
      products: enrichmentResult.products,
      apiCalls: {
        total: apiCallCount,
        adminToken: 1,
        products: 1,
        categories: enrichmentResult.categoriesApiCalls,
        inventory: enrichmentResult.inventoryApiCalls,
      },
    };
  } catch (error) {
    throw new Error(`Commerce API integration failed: ${error.message}`);
  }
}

/**
 * Get admin token for Commerce API authentication
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} Bearer token
 */
async function getAdminToken(params, config) {
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
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Promise<Array>} Array of products
 */
async function fetchProducts(params, config, bearerToken) {
  const { baseUrl, api } = config.commerce;
  const productsUrl = `${baseUrl}/rest/${api.version}${api.paths.products}?searchCriteria[pageSize]=${config.products.expectedCount}`;

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
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @param {string} bearerToken - Admin bearer token
 * @returns {Promise<Array>} Enriched products
 */
async function enrichProducts(products, params, config, bearerToken) {
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

  // Calculate actual API calls made
  const categoriesApiCalls = categoryPromises.length;
  const inventoryApiCalls = inventoryPromises.length;

  // Enrich products with the fetched data
  const enrichedProducts = products.map((product) => {
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

  return {
    products: enrichedProducts,
    apiCalls: categoriesApiCalls + inventoryApiCalls,
    categoriesApiCalls,
    inventoryApiCalls,
  };
}

/**
 * Fetch categories for a batch of products
 * @param {Array} products - Product batch
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @returns {Promise<Array>} Category data
 */
async function fetchCategoriesForProducts(products, bearerToken, baseUrl, api) {
  const productIds = products.map((p) => p.id).join(',');
  const url = buildCommerceUrl(baseUrl, api, '/products/categories', { product_id: productIds });
  return await fetchCommerceData(url, bearerToken, 'GET', 'Categories');
}

/**
 * Fetch inventory for a batch of products
 * @param {Array} products - Product batch
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @returns {Promise<Array>} Inventory data
 */
async function fetchInventoryForProducts(products, bearerToken, baseUrl, api) {
  const skus = products.map((p) => p.sku).join(',');
  const url = buildCommerceUrl(baseUrl, api, api.paths.stockItems, { product_sku: skus });
  return await fetchCommerceData(url, bearerToken, 'GET', 'Inventory');
}

/**
 * Transform mesh products to REST API format
 * @param {Array} products - Mesh product data
 * @param {Object} config - Configuration object
 * @returns {Array} Transformed products
 */
function transformMeshProductsToRestFormat(products, config) {
  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    // Extract price from Commerce API standard format
    price: product.price || 0,
    price_range: {
      minimum_price: {
        regular_price: { value: product.price || 0, currency: 'USD' },
        final_price: { value: product.price || 0, currency: 'USD' },
      },
    },
    status: product.status || 1,
    type_id: product.type_id || 'simple',
    qty: product.qty || 0,
    stock_status: product.stock_status || 'IN_STOCK',
    categories: product.categories,
    // Map images correctly for buildProducts function
    images: product.media_gallery_entries
      ? product.media_gallery_entries.map((img) => ({
          url: img.url || `${config.commerce.baseUrl}/media/catalog/product${img.file}`,
          file: img.file,
          position: img.position,
          types: img.types || ['image'],
        }))
      : [],
    // Add missing fields that buildProducts expects
    message: '', // Commerce API doesn't provide this, so empty
    page_url: `${config.commerce.baseUrl}/catalog/product/view/sku/${product.sku}`, // Generate product page URL
    type: 'product',
    custom_attributes: product.custom_attributes,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }));
}

/**
 * Fetch enriched products from API Mesh
 * Uses GraphQL query to consolidate multiple Commerce API calls
 *
 * @param {Object} params - Action parameters (includes token in Authorization header)
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Mesh response with products and performance data
 */
async function getProductsFromMesh(params, config) {
  const startTime = Date.now();

  if (!params.API_MESH_ENDPOINT || !params.MESH_API_KEY) {
    throw new Error('API Mesh credentials not provided');
  }

  // Extract Commerce admin token from Authorization header (Adobe standard pattern)
  const { getBearerToken } = require('./utils');
  const commerceToken = getBearerToken(params);
  if (!commerceToken) {
    throw new Error(
      'Commerce admin token required. Call auth-token action first to generate token.'
    );
  }

  // Use custom resolver with full API call tracking and optimization
  const query = `
    query GetEnrichedProducts($pageSize: Int) {
      mesh_products_enriched(pageSize: $pageSize) {
        products {
          sku
          name
          price
          qty
          categories {
            id
            name
          }
          media_gallery_entries {
            file
            url
            position
            types
          }
          inventory {
            qty
            is_in_stock
          }
        }
        total_count
        message
        performance {
          processedProducts
          apiCalls
          method
          totalApiCalls
          productsApiCalls
          categoriesApiCalls
          inventoryApiCalls
          clientCalls
          dataSourcesUnified
        }
      }
    }
  `;

  const variables = {
    pageSize: params.pageSize || config.products.expectedCount,
  };

  try {
    const response = await fetch(params.API_MESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.MESH_API_KEY,
        'x-commerce-admin-token': commerceToken, // Pass Commerce token to mesh
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

    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    const meshData = result.data?.mesh_products_enriched;
    if (!meshData) {
      throw new Error('No mesh_products_enriched data in response');
    }

    const products = meshData.products;

    // Transform mesh response to match REST API format exactly
    const transformedProducts = transformMeshProductsToRestFormat(products, config);

    return {
      products: transformedProducts,
      performance: meshData.performance,
      total_count: meshData.total_count,
      message: meshData.message,
    };
  } catch (error) {
    const errorTime = Date.now() - startTime;
    throw new Error(`Mesh integration failed after ${errorTime}ms: ${error.message}`);
  }
}

module.exports = {
  fetchAndEnrichProducts,
  getAdminToken,
  fetchProducts,
  enrichProducts,
  getProductsFromMesh,
  transformMeshProductsToRestFormat,
};
