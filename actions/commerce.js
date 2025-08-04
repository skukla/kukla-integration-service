/**
 * Adobe Commerce API Integration Module
 * Handles authentication, product fetching, and data enrichment with standardized Adobe patterns
 */

const { fetchCommerceData } = require('./utils');

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

  // Extract unique category IDs from all products
  const categoryIds = new Set();
  products.forEach((product) => {
    if (product.extension_attributes && product.extension_attributes.category_links) {
      product.extension_attributes.category_links.forEach((link) => {
        categoryIds.add(link.category_id);
      });
    }
  });

  // Fetch inventory in batches for performance
  const inventoryPromises = [];

  // Batch inventory fetches
  for (let i = 0; i < products.length; i += batching.inventory) {
    const batch = products.slice(i, i + batching.inventory);
    inventoryPromises.push(fetchInventoryForProducts(batch, bearerToken, baseUrl, api));
  }

  // Fetch category names for all unique category IDs
  const categoryPromises = Array.from(categoryIds).map((categoryId) =>
    fetchCategoryById(categoryId, bearerToken, baseUrl, api)
  );

  // Wait for all enrichment data
  const [inventoryResults, categoryResults] = await Promise.all([
    Promise.all(inventoryPromises),
    Promise.all(categoryPromises),
  ]);

  // Flatten inventory results
  const allInventory = inventoryResults.flat();

  // Create lookup maps for performance
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

  // Calculate actual API calls made
  const categoriesApiCalls = categoryPromises.length;
  const inventoryApiCalls = inventoryPromises.length;

  // Enrich products with the fetched data
  const enrichedProducts = products.map((product) => {
    const enriched = { ...product };

    // Add category data from extension_attributes.category_links with fetched names
    if (product.extension_attributes && product.extension_attributes.category_links) {
      enriched.categories = product.extension_attributes.category_links.map((link) => {
        // Try both string and number versions of the category ID
        const categoryInfo = categoryMap.get(link.category_id) || categoryMap.get(link.category_id.toString());
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
  });

  return {
    products: enrichedProducts,
    apiCalls: categoriesApiCalls + inventoryApiCalls,
    categoriesApiCalls,
    inventoryApiCalls,
  };
}

/**
 * Fetch category by ID
 * @param {string} categoryId - Category ID
 * @param {string} bearerToken - Admin bearer token
 * @param {string} baseUrl - Commerce base URL
 * @param {Object} api - API configuration
 * @returns {Promise<Object|null>} Category data
 */
async function fetchCategoryById(categoryId, bearerToken, baseUrl, api) {
  const url = `${baseUrl}/rest/${api.version}/categories/${categoryId}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    });

    if (!response.ok) {
      console.warn(`Category fetch failed for ID ${categoryId}: ${response.status}`);
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
    console.warn(`Category fetch failed for ID ${categoryId}: ${error.message}`);
    return null;
  }
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
  const inventoryPromises = products.map(async (product) => {
    const url = `${baseUrl}/rest/${api.version}/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=${product.sku}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      
      if (!response.ok) {
        return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
      }
      
      const result = await response.json();
      const sourceItems = result.items || [];
      
      // Sum quantities from all source items for this SKU
      const totalQty = sourceItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const isInStock = sourceItems.some(item => item.status === 1); // 1 = enabled/in stock
      
      return {
        product_id: product.id,
        sku: product.sku,
        qty: totalQty,
        is_in_stock: isInStock
      };
    } catch (error) {
      console.warn(`Inventory fetch failed for ${product.sku}: ${error.message}`);
      return { product_id: product.id, sku: product.sku, qty: 0, is_in_stock: false };
    }
  });
  
  return await Promise.all(inventoryPromises);
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
