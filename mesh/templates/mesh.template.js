/**
 * Adobe Commerce API Mesh Integration Module
 * Handles GraphQL mesh operations following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

const { getCommerceToken } = require('./auth');

// GraphQL query for enriched products (build-time inlined from .gql file)
const GET_ENRICHED_PRODUCTS_QUERY = {{{GET_ENRICHED_PRODUCTS_QUERY}}};

/**
 * Fetch enriched products from API Mesh with pagination
 * Uses GraphQL query to consolidate multiple Commerce API calls
 *
 * @param {Object} params - Action parameters (includes token in Authorization header)
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Mesh response with products, performance data, and API call count
 */
async function getProductsFromMesh(params, config, logger = null) {
  const log = logger || Core.Logger('commerce-mesh');
  const startTime = Date.now();

  if (!params.API_MESH_ENDPOINT || !params.MESH_API_KEY) {
    const error = 'API Mesh credentials not provided';
    log.error('Mesh credentials missing', { error });
    throw new Error(error);
  }

  try {
    log.info('Starting mesh product fetch with pagination');

    // Generate Commerce admin token using centralized approach
    const commerceTokenResult = await getCommerceToken(params, config, log);
    const commerceToken = commerceTokenResult?.token || commerceTokenResult;

    // The mesh resolver handles pagination internally, so we make a single request
    const query = GET_ENRICHED_PRODUCTS_QUERY;
    const apiCallCount = 1;
    
    // Optional pageSize override for testing
    const variables = {};
    if (params.pageSize) {
      variables.pageSize = params.pageSize;
    }

    log.info('Making GraphQL mesh request (resolver handles pagination internally)', variables);
    
    const response = await fetch(params.API_MESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.MESH_API_KEY,
        'x-commerce-admin-token': commerceToken,
        'User-Agent': 'Adobe-App-Builder/kukla-integration-service',
      },
      body: JSON.stringify({
        query,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Mesh API request failed: ${response.status} ${response.statusText} - ${errorText}`;
      log.error('Mesh API request failed', { status: response.status, error: errorText });
      throw new Error(errorMsg);
    }

    const result = await response.json();

    if (result.errors) {
      const errorMsg = `GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`;
      log.error('GraphQL errors in mesh response', { errors: result.errors });
      throw new Error(errorMsg);
    }

    const meshData = result.data?.mesh_products_enriched;
    if (!meshData) {
      const error = 'No mesh_products_enriched data in response';
      log.error('Invalid mesh response', { error, response: result });
      throw new Error(error);
    }

    const allProducts = meshData.products || [];
    const totalPerformance = meshData.performance;

    log.info('Mesh data retrieved successfully', {
      totalProductCount: allProducts.length,
      totalApiCalls: apiCallCount,
      performance: totalPerformance,
    });

    // Transform mesh response to match REST API format exactly
    const transformedProducts = transformMeshProductsToRestFormat(allProducts, config);

    return {
      products: transformedProducts,
      performance: {
        ...totalPerformance,
        meshApiCalls: apiCallCount // Add mesh-specific API call tracking
      },
      total_count: allProducts.length,
      apiCallCount, // For consistency with REST approach
      message: `Retrieved ${allProducts.length} products via ${apiCallCount} GraphQL calls`,
    };
  } catch (error) {
    const errorTime = Date.now() - startTime;
    const errorMsg = `Mesh integration failed after ${errorTime}ms: ${error.message}`;
    log.error('Mesh integration failed', { duration: errorTime, error: error.message });
    throw new Error(errorMsg);
  }
}

/**
 * Simple transformation function for mesh products
 * @param {Array} products - Mesh product data
 * @param {Object} config - Configuration object
 * @returns {Array} Products (minimal transformation)
 */
function transformMeshProductsToRestFormat(products, config) {
  // For now, return products as-is since mesh already provides well-formatted data
  // This function exists to maintain compatibility with mesh integration
  return products;
}

module.exports = {
  getProductsFromMesh,
  transformMeshProductsToRestFormat,
};