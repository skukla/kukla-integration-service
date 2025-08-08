/**
 * Adobe Commerce API Mesh Integration Module
 * Handles GraphQL mesh operations following Adobe standards
 */

const { Core } = require('@adobe/aio-sdk');

const { getCommerceToken } = require('./auth');
const { transformMeshProductsToRestFormat } = require('./products');

// GraphQL query for enriched products (build-time inlined from .gql file)
const GET_ENRICHED_PRODUCTS_QUERY = 'query GetEnrichedProducts($pageSize: Int) {\n  mesh_products_enriched(pageSize: $pageSize) {\n    products {\n      sku\n      name\n      price\n      type_id\n      custom_attributes {\n        attribute_code\n        value\n      }\n      inventory {\n        quantity\n      }\n      categories {\n        name\n      }\n      media_gallery_entries {\n        url\n        types\n      }\n    }\n    total_count\n    message\n    performance {\n      method\n      productCount\n      executionTime\n      apiCalls\n      dataSourcesUnified\n    }\n  }\n}';

/**
 * Fetch enriched products from API Mesh
 * Uses GraphQL query to consolidate multiple Commerce API calls
 *
 * @param {Object} params - Action parameters (includes token in Authorization header)
 * @param {Object} config - Configuration object
 * @param {Object} logger - Adobe logger instance
 * @returns {Promise<Object>} Mesh response with products and performance data
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
    log.info('Starting mesh product fetch');

    // Generate Commerce admin token using centralized approach
    const commerceToken = await getCommerceToken(params, config, log);

    // Use custom resolver with full API call tracking and optimization
    const query = GET_ENRICHED_PRODUCTS_QUERY;

    const variables = {
      pageSize: params.pageSize || config.products.expectedCount,
    };

    log.info('Making GraphQL mesh request', { pageSize: variables.pageSize });
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

    const products = meshData.products;
    log.info('Mesh data retrieved successfully', {
      productCount: products.length,
      totalCount: meshData.total_count,
      performance: meshData.performance,
    });

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
    const errorMsg = `Mesh integration failed after ${errorTime}ms: ${error.message}`;
    log.error('Mesh integration failed', { duration: errorTime, error: error.message });
    throw new Error(errorMsg);
  }
}

module.exports = {
  getProductsFromMesh,
};
