/**
 * API Mesh Business Logic for Adobe App Builder
 * Handles GraphQL mesh integration for consolidated Commerce API access
 */

/**
 * Fetch enriched products from API Mesh
 * Uses GraphQL query to consolidate multiple Commerce API calls
 * Expects Commerce admin token to be passed via Authorization header
 *
 * @param {Object} params - Action parameters (includes token in Authorization header)
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Mesh response with products and performance data
 */
async function fetchEnrichedProductsFromMesh(params, config) {
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
    const transformedProducts = products.map((product) => ({
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
  fetchEnrichedProductsFromMesh,
};
