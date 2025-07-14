/**
 * Products Source Resolver for JSON Schema Multi-Source Architecture
 * 
 * Focused resolver that handles Products API calls with OAuth authentication.
 * Integrates with buildProducts step for consistent data transformation.
 */

const { createOAuthHeader, extractOAuthCredentials } = require('../utilities/oauth');
const { initializePerformanceTracking, calculatePerformanceMetrics, updateApiCallMetrics } = require('../utilities/performance');

// Configuration
const COMMERCE_BASE_URL = 'https://citisignal-com774.adobedemo.com';
const PRODUCT_FIELDS = 'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries,custom_attributes],total_count';
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_PAGES = 25;

/**
 * Fetch all products with pagination and OAuth authentication
 */
async function fetchAllProducts(context, pageSize = DEFAULT_BATCH_SIZE, maxPages = DEFAULT_MAX_PAGES, performance = null) {
  console.log('🔍 Products resolver: fetchAllProducts called with pageSize:', pageSize, 'maxPages:', maxPages);
  
  const allProducts = [];
  let currentPage = 1;

  try {
    const oauthParams = extractOAuthCredentials(context);

    while (currentPage <= maxPages) {
      const url = COMMERCE_BASE_URL + '/rest/V1/products?searchCriteria[pageSize]=' + pageSize + '&searchCriteria[currentPage]=' + currentPage + '&fields=' + PRODUCT_FIELDS;
      const authHeader = await createOAuthHeader(oauthParams, 'GET', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (performance) {
        updateApiCallMetrics(performance, 'products', 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Products API failed: ' + response.status + ' ' + response.statusText + ' - ' + errorText);
        break;
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        break;
      }

      allProducts.push(...data.items);

      if (data.items.length < pageSize || !data.total_count || allProducts.length >= data.total_count) {
        break;
      }

      currentPage++;
    }

    console.log('📦 Products resolver: fetchAllProducts returned:', allProducts.length, 'products');
    return allProducts;
  } catch (error) {
    console.error('Products resolver: Failed to fetch products: ' + error.message);
    throw new Error('Failed to fetch products: ' + error.message);
  }
}

/**
 * Extract category IDs from products
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();
  
  products.forEach((product) => {
    if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
      product.custom_attributes.forEach((attr) => {
        if (attr.attribute_code === 'category_ids' && attr.value) {
          try {
            const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
            ids.forEach((id) => categoryIds.add(id.toString()));
          } catch (e) {
            // Skip invalid category IDs
          }
        }
      });
    }
  });
  
  return categoryIds;
}

/**
 * Extract SKUs from products
 */
function extractSkus(products) {
  return products.map(product => product.sku).filter(Boolean);
}

/**
 * Products resolver for JSON Schema handler
 */
async function productsResolver(parent, args, context) {
  const performance = initializePerformanceTracking('JSON Schema - Products');
  
  try {
    const pageSize = args.pageSize || DEFAULT_BATCH_SIZE;
    const maxPages = args.maxPages || DEFAULT_MAX_PAGES;
    
    // Fetch all products
    const products = await fetchAllProducts(context, pageSize, maxPages, performance);
    
    // Extract identifiers for enrichment
    const categoryIds = extractCategoryIds(products);
    const skus = extractSkus(products);
    
    // Update performance metrics
    performance.processedProducts = products.length;
    calculatePerformanceMetrics(performance, categoryIds, skus);
    
    console.log('✅ Products resolver: Successfully fetched', products.length, 'products');
    
    // Return raw products data - enrichment will be handled by main resolver
    return {
      products: products,
      total_count: products.length,
      categoryIds: Array.from(categoryIds),
      skus: skus,
      performance: performance,
      source: 'Products',
      method: 'JSON Schema',
    };
    
  } catch (error) {
    console.error('❌ Products resolver error:', error);
    throw new Error('Products resolver failed: ' + error.message);
  }
}

module.exports = {
  productsResolver,
  fetchAllProducts,
  extractCategoryIds,
  extractSkus,
};
