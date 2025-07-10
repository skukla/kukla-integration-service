/**
 * Mesh Resolvers - Workflows Domain
 * Commerce API workflows for mesh resolvers
 *
 * This file contains high-level orchestration functions following our domain-driven architecture.
 * Workflows coordinate Commerce API calls and business processes.
 */

// Import dependencies
// Note: In actual mesh environment, all code will be embedded during generation
const { extractOAuthCredentials } = require('./operations');
const {
  meshConfig,
  commerceBaseUrl,
  getCachedCategory,
  cacheCategory,
  buildCategoryMapFromCache,
  createOAuthHeader,
} = require('./utils');

// =============================================================================
// COMMERCE API WORKFLOWS
// =============================================================================

/**
 * Fetch all products from Commerce API with pagination
 * Business operation that coordinates product fetching
 * @param {Object} context - GraphQL context
 * @param {number} pageSize - Items per page
 * @param {number} maxPages - Maximum pages to fetch
 * @param {Object} [performance] - Performance tracking object
 * @returns {Promise<Array>} Array of products
 * @throws {Error} If product fetching fails
 */
async function fetchAllProductsFromSource(context, pageSize, maxPages, performance = null) {
  const allProducts = [];
  let currentPage = 1;

  // Extract OAuth credentials (validates automatically)
  const oauthParams = extractOAuthCredentials(context);

  try {
    while (currentPage <= maxPages) {
      const url =
        commerceBaseUrl +
        '/rest/V1/products?searchCriteria[pageSize]=' +
        pageSize +
        '&searchCriteria[currentPage]=' +
        currentPage +
        '&fields={{{COMMERCE_PRODUCT_FIELDS}}}';

      const authHeader = await createOAuthHeader(oauthParams, 'GET', url);

      // Track API call
      if (performance) {
        performance.productsApiCalls++;
        performance.totalApiCalls++;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          'Products API request failed: ' + response.status + ' ' + response.statusText
        );
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        break;
      }

      allProducts.push(...data.items);

      // Check if we should continue pagination
      if (
        data.items.length < pageSize ||
        !data.total_count ||
        allProducts.length >= data.total_count
      ) {
        break;
      }

      currentPage++;
    }

    return allProducts;
  } catch (error) {
    throw new Error('Failed to fetch products: ' + error.message);
  }
}

/**
 * Fetch category data from Commerce API in batches
 * Business operation that coordinates category data fetching with caching
 * @param {Object} context - GraphQL context
 * @param {Array} categoryIds - Array of category IDs
 * @param {Object} [performance] - Performance tracking object
 * @returns {Promise<Object>} Category map
 * @throws {Error} If category fetching fails
 */
async function fetchCategoriesFromSource(context, categoryIds, performance = null) {
  const categoryMap = {};
  const batchSize = meshConfig.batching.categories;

  if (categoryIds.length === 0) {
    return categoryMap;
  }

  // Step 1: Check cache first (optimization)
  const cachedCategories = buildCategoryMapFromCache(categoryIds);
  Object.assign(categoryMap, cachedCategories);

  // Step 2: Filter out already cached categories
  const uncachedIds = categoryIds.filter((id) => !getCachedCategory(id));

  // Track cache performance
  const cachedCount = categoryIds.length - uncachedIds.length;
  if (performance) {
    performance.categoriesCached = cachedCount;
    performance.categoriesFetched = uncachedIds.length;
  }

  if (uncachedIds.length === 0) {
    // All categories were cached - 0 API calls needed!
    console.log('All', categoryIds.length, 'categories served from cache - 0 API calls');
    return categoryMap;
  }

  console.log('Cache hit for', cachedCount, 'categories, fetching', uncachedIds.length, 'from API');

  // Step 3: Fetch uncached categories
  const oauthParams = extractOAuthCredentials(context);

  try {
    // Process uncached categories in batches
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);

      const promises = batch.map(async (categoryId) => {
        const url = commerceBaseUrl + '/rest/V1/categories/' + categoryId;
        const authHeader = await createOAuthHeader(oauthParams, 'GET', url);

        // Track API call
        if (performance) {
          performance.categoriesApiCalls++;
          performance.totalApiCalls++;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Category ' + categoryId + ' fetch failed: ' + response.status);
          return null;
        }

        const category = await response.json();

        // Cache the fetched category
        cacheCategory(categoryId, category);

        return { id: categoryId, data: category };
      });

      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result && result.data) {
          categoryMap[result.id] = result.data;
        }
      });
    }

    return categoryMap;
  } catch (error) {
    throw new Error('Failed to fetch categories: ' + error.message);
  }
}

/**
 * Get admin Bearer token using username/password authentication
 * Business operation for admin token acquisition
 * @param {Object} context - GraphQL context with admin credentials
 * @param {Object} [performance] - Performance tracking object
 * @returns {Promise<string>} Bearer token
 * @throws {Error} If authentication fails
 */
async function getAdminToken(context, performance = null) {
  const username = context.adminCredentials?.username;
  const password = context.adminCredentials?.password;

  if (!username || !password) {
    throw new Error(
      'Admin credentials required for inventory: adminUsername and adminPassword GraphQL variables'
    );
  }

  const tokenUrl = '{{{COMMERCE_BASE_URL}}}' + '/rest/all/V1/integration/admin/token';

  // Track API call
  if (performance) {
    performance.inventoryApiCalls++;
    performance.totalApiCalls++;
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to get admin token: ' + response.status + ' ' + response.statusText);
  }

  const token = await response.json();
  return token; // Returns the bearer token string
}

/**
 * Create search criteria for inventory API
 * Helper function for inventory fetching
 * @param {Array} skus - Array of SKUs
 * @returns {string} URL query string
 */
function createInventorySearchCriteria(skus) {
  const searchCriteria = {
    filterGroups: [
      {
        filters: [
          {
            field: 'sku',
            value: skus.join(','),
            conditionType: 'in',
          },
        ],
      },
    ],
  };

  return new URLSearchParams({
    searchCriteria: JSON.stringify(searchCriteria),
  }).toString();
}

/**
 * Process a single inventory batch
 * Helper function for inventory fetching
 * @param {Array} batch - Batch of SKUs
 * @param {string} bearerToken - Authentication token
 * @param {Object} [performance] - Performance tracking object
 * @returns {Promise<Object>} Inventory data for batch
 */
async function processInventoryBatch(batch, bearerToken, performance = null) {
  const queryParams = createInventorySearchCriteria(batch);
  const url = '{{{COMMERCE_BASE_URL}}}' + '/rest/all/V1/inventory/source-items?' + queryParams;

  console.log('Calling inventory API:', url.substring(0, 100) + '...');

  // Track API call
  if (performance) {
    performance.inventoryApiCalls++;
    performance.totalApiCalls++;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + bearerToken,
      'Content-Type': 'application/json',
    },
  });

  console.log('Inventory API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(
      'Inventory batch fetch failed: ' +
        response.status +
        ' ' +
        response.statusText +
        ' - ' +
        errorText
    );
    return {};
  }

  const data = await response.json();
  console.log('Inventory API returned', data.items?.length || 0, 'items');

  const batchInventoryMap = {};
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item) => {
      if (item.sku) {
        console.log('Inventory for', item.sku, ':', item.quantity);
        batchInventoryMap[item.sku] = {
          qty: item.quantity || 0,
          is_in_stock: item.status === 1,
        };
      }
    });
  }

  return batchInventoryMap;
}

/**
 * Fetch inventory data from Commerce API in batches
 * Business operation that coordinates inventory data fetching
 * @param {Object} context - GraphQL context
 * @param {Array} skus - Array of SKUs
 * @param {Object} [performance] - Performance tracking object
 * @returns {Promise<Object>} Inventory map
 * @throws {Error} If inventory fetching fails
 */
async function fetchInventoryFromSource(context, skus, performance = null) {
  const inventoryMap = {};

  try {
    // Step 1: Get Bearer token authentication for inventory
    const bearerToken = await getAdminToken(context, performance);
    const batchSize = meshConfig.batching.inventory;

    console.log('Fetching inventory for', skus.length, 'SKUs with Bearer token');

    // Step 2: Process SKUs in batches
    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize);
      const batchInventoryMap = await processInventoryBatch(batch, bearerToken, performance);
      Object.assign(inventoryMap, batchInventoryMap);
    }

    console.log('Final inventory map has', Object.keys(inventoryMap).length, 'entries');
    return inventoryMap;
  } catch (error) {
    console.error('Inventory fetch error:', error);
    throw new Error('Failed to fetch inventory: ' + error.message);
  }
}

// =============================================================================
// PERFORMANCE TRACKING WORKFLOWS
// =============================================================================

/**
 * Calculate dynamic performance metrics
 * Business function that computes mesh efficiency metrics
 * @param {Object} performance - Performance tracking object
 * @param {Set} categoryIds - Category IDs set
 * @param {Array} skus - SKUs array
 * @param {number} startTime - Start timestamp
 * @returns {Object} Enhanced performance metrics
 */
function calculatePerformanceMetrics(performance, categoryIds, skus, startTime) {
  const endTime = Date.now();
  performance.executionTime = (endTime - startTime) / 1000; // Convert to seconds
  performance.productCount = performance.processedProducts;
  performance.skuCount = skus.length;
  performance.uniqueCategories = categoryIds.size;

  // Calculate dynamic client-perspective efficiency metrics
  let sourcesUsed = 0;
  if (performance.productsApiCalls > 0) sourcesUsed++; // Products API
  if (performance.categoriesApiCalls > 0 || performance.categoriesCached > 0) sourcesUsed++; // Categories API/Cache
  if (performance.inventoryApiCalls > 0) sourcesUsed++; // Inventory API
  performance.dataSourcesUnified = sourcesUsed;

  // Calculate actual mesh consolidation ratio
  const actualMeshCalls = performance.totalApiCalls || performance.apiCalls;
  performance.queryConsolidation = actualMeshCalls + ':1';

  // Calculate actual cache hit rate
  if (performance.categoriesCached + performance.categoriesFetched > 0) {
    performance.cacheHitRate = Math.round(
      (performance.categoriesCached /
        (performance.categoriesCached + performance.categoriesFetched)) *
        100
    );
  }

  // Populate mesh optimizations based on actual execution
  performance.meshOptimizations = [];
  if (performance.categoriesCached > 0) {
    performance.meshOptimizations.push('Category Caching');
  }
  if (performance.dataSourcesUnified > 1) {
    performance.meshOptimizations.push('Multi-API Consolidation');
  }
  if (performance.categoriesApiCalls > 0 && performance.inventoryApiCalls > 0) {
    performance.meshOptimizations.push('Parallel Data Fetching');
  }
  if (performance.queryConsolidation && performance.queryConsolidation !== '1:1') {
    performance.meshOptimizations.push('Query Consolidation');
  }

  return performance;
}

/**
 * Initialize performance tracking
 * Pure function that creates performance tracking object
 * @returns {Object} Performance tracking object
 */
function initializePerformanceTracking() {
  return {
    // Traditional metrics (for comparison)
    processedProducts: 0,
    apiCalls: 0,
    productsApiCalls: 0,
    categoriesApiCalls: 0,
    inventoryApiCalls: 0,
    totalApiCalls: 0,
    uniqueCategories: 0,
    productCount: 0,
    skuCount: 0,
    method: 'API Mesh',
    executionTime: 0,

    // Client-perspective efficiency metrics (calculated dynamically)
    clientCalls: 1, // Client makes only 1 GraphQL query (always true)
    dataSourcesUnified: 0, // Will be calculated based on actual APIs called
    queryConsolidation: null, // Will be calculated as "X:1" ratio
    cacheHitRate: 0, // Percentage of cached categories
    categoriesCached: 0, // Number of categories served from cache
    categoriesFetched: 0, // Number of categories fetched from API

    // Mesh advantages (calculated dynamically)
    operationComplexity: 'single-query', // Always true for GraphQL mesh
    dataFreshness: 'real-time', // Mesh gets fresh data
    clientComplexity: 'minimal', // Client sends 1 query vs orchestrating multiple
    apiOrchestration: 'automated', // Mesh handles all coordination
    parallelization: 'automatic', // Mesh handles parallel data fetching
    meshOptimizations: [], // Will be populated with actual optimizations used
  };
}

// Export functions for use in other resolver files
module.exports = {
  // Commerce API workflows
  fetchAllProductsFromSource,
  fetchCategoriesFromSource,
  getAdminToken,
  fetchInventoryFromSource,

  // Performance tracking workflows
  calculatePerformanceMetrics,
  initializePerformanceTracking,
};
