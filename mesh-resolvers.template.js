/**
 * API Mesh Resolver - Consolidated Products (Template-Generated)
 *
 * Single resolver that orchestrates Commerce API calls for enriched product data.
 * Uses template substitution for environment-specific configuration.
 *
 * Template Variables:
 * - {{{COMMERCE_BASE_URL}}} - Commerce instance base URL
 * - {{{COMMERCE_PRODUCT_FIELDS}}} - Product fields to fetch
 * - {{{MESH_CACHE_TTL}}} - Category cache TTL in milliseconds
 */

// =============================================================================
// CONFIGURATION (Template Substitution)
// =============================================================================

const commerceBaseUrl = '{{{COMMERCE_BASE_URL}}}';
const productFields = 'items[{{{COMMERCE_PRODUCT_FIELDS}}}],total_count';
const CACHE_TTL = parseInt('{{{MESH_CACHE_TTL}}}');
const batchSize = 20;
const categoryCache = new Map();

// =============================================================================
// OAUTH UTILITIES (SHARED)
// =============================================================================

/**
 * Percent encoding for OAuth (RFC 3986)
 */
function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API (working implementation from master)
 */
async function generateHmacSignature(key, data) {
  try {
    // Convert strings to ArrayBuffer
    const keyBuffer = new TextEncoder().encode(key);
    const dataBuffer = new TextEncoder().encode(data);

    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Generate signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);

    // Convert to base64
    const signatureArray = new Uint8Array(signatureBuffer);
    let binaryString = '';
    for (let i = 0; i < signatureArray.length; i++) {
      binaryString += String.fromCharCode(signatureArray[i]);
    }

    return btoa(binaryString);
  } catch (error) {
    throw new Error('Failed to generate HMAC signature: ' + error.message);
  }
}

/**
 * Create OAuth 1.0 authorization header
 */
async function createOAuthHeader(oauthParams, method, url) {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = oauthParams;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  const urlObj = new URL(url);
  const baseUrl = urlObj.protocol + '//' + urlObj.host + urlObj.pathname;

  const oauthSignatureParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  const queryParams = {};
  for (const [key, value] of urlObj.searchParams) {
    queryParams[key] = value;
  }

  const allParams = { ...oauthSignatureParams, ...queryParams };
  const parameterString = Object.keys(allParams)
    .sort()
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(allParams[key]))
    .join('&');

  const signatureBaseString =
    method.toUpperCase() +
    '&' +
    encodeURIComponent(baseUrl) +
    '&' +
    encodeURIComponent(parameterString);

  const signingKey =
    encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(accessTokenSecret);
  const signature = await generateHmacSignature(signingKey, signatureBaseString);

  oauthSignatureParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthSignatureParams)
    .sort()
    .map((key) => key + '="' + encodeURIComponent(oauthSignatureParams[key]) + '"')
    .join(', ');

  return 'OAuth ' + headerParams;
}

/**
 * Extract OAuth credentials from GraphQL context
 */
function extractOAuthCredentials(context) {
  const oauthParams = {
    consumerKey: context.headers['x-commerce-consumer-key'],
    consumerSecret: context.headers['x-commerce-consumer-secret'],
    accessToken: context.headers['x-commerce-access-token'],
    accessTokenSecret: context.headers['x-commerce-access-token-secret'],
  };

  if (
    !oauthParams.consumerKey ||
    !oauthParams.consumerSecret ||
    !oauthParams.accessToken ||
    !oauthParams.accessTokenSecret
  ) {
    throw new Error('OAuth credentials required in headers');
  }

  return oauthParams;
}

// =============================================================================
// CATEGORY UTILITIES (SHARED)
// =============================================================================

function getCachedCategory(categoryId) {
  const cached = categoryCache.get(categoryId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (cached) {
    categoryCache.delete(categoryId);
  }

  return null;
}

function cacheCategory(categoryId, data) {
  categoryCache.set(categoryId, {
    timestamp: Date.now(),
    data: data,
  });
}

function buildCategoryMapFromCache(categoryIds) {
  const categoryMap = {};
  categoryIds.forEach((id) => {
    const cached = getCachedCategory(id);
    if (cached) {
      categoryMap[id] = cached;
    }
  });
  return categoryMap;
}

// =============================================================================
// PRODUCT FETCHING
// =============================================================================

/**
 * Fetch all products with pagination and OAuth authentication
 */
async function fetchAllProducts(context, pageSize, maxPages) {
  console.log('🔍 fetchAllProducts called with pageSize:', pageSize, 'maxPages:', maxPages);
  const allProducts = [];
  let currentPage = 1;

  try {
    const oauthParams = extractOAuthCredentials(context);

    while (currentPage <= maxPages) {
      const url = `${commerceBaseUrl}/rest/V1/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=${productFields}`;
      const authHeader = await createOAuthHeader(oauthParams, 'GET', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Products API failed: ${response.status} ${response.statusText} - ${errorText}`
        );
        return [];
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        break;
      }

      allProducts.push(...data.items);

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
    console.error(`Failed to fetch products: ${error.message}`);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

// =============================================================================
// INVENTORY FETCHING
// =============================================================================

async function getAdminToken(context) {
  // Get pre-generated admin token from context headers (secure approach)
  const token = context.adminToken;

  if (!token) {
    throw new Error('Admin token required for inventory: x-commerce-admin-token header');
  }

  return token;
}

/**
 * Fetch inventory data for given SKUs
 */
async function fetchInventoryData(context, skus) {
  const inventoryMap = {};

  try {
    const bearerToken = await getAdminToken(context);

    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize);

      const searchCriteria = {
        filterGroups: [
          {
            filters: [
              {
                field: 'sku',
                value: batch.join(','),
                conditionType: 'in',
              },
            ],
          },
        ],
      };

      const queryParams = new URLSearchParams({
        searchCriteria: JSON.stringify(searchCriteria),
      });

      const url = `${commerceBaseUrl}/rest/all/V1/inventory/source-items?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `Inventory batch fetch failed: ${response.status} ${response.statusText} - ${errorText}`
        );
        continue;
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          if (item.sku) {
            inventoryMap[item.sku] = {
              qty: item.quantity || 0,
              is_in_stock: item.status === 1,
            };
          }
        });
      }
    }

    return inventoryMap;
  } catch (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }
}

// =============================================================================
// CATEGORY FETCHING
// =============================================================================

/**
 * Fetch categories data with OAuth authentication and caching
 */
async function fetchCategoriesData(context, categoryIds) {
  const categoryMap = {};

  if (categoryIds.length === 0) {
    return categoryMap;
  }

  // Get cached categories
  const cachedCategories = buildCategoryMapFromCache(categoryIds);
  Object.assign(categoryMap, cachedCategories);

  // Find uncached category IDs
  const uncachedIds = categoryIds.filter((id) => !getCachedCategory(id));

  if (uncachedIds.length === 0) {
    return categoryMap;
  }

  const oauthParams = extractOAuthCredentials(context);

  try {
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);

      const promises = batch.map(async (categoryId) => {
        const url = `${commerceBaseUrl}/rest/V1/categories/${categoryId}`;
        const authHeader = await createOAuthHeader(oauthParams, 'GET', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Category ${categoryId} fetch failed: ${response.status}`);
          return null;
        }

        const category = await response.json();
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
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
}

// =============================================================================
// DATA ENRICHMENT
// =============================================================================

/**
 * Extract category IDs and SKUs from products
 */
function extractProductIdentifiers(products) {
  const categoryIds = new Set();
  const skus = [];

  products.forEach((product) => {
    // Extract SKUs
    if (product.sku) {
      skus.push(product.sku);
    }

    // Extract category IDs from custom attributes
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

  return { categoryIds, skus };
}

/**
 * Enrich products with category and inventory data
 */
function enrichProductsWithData(products, categoryMap, inventoryMap) {
  return products.map((product) => {
    const sku = product.sku;
    const inventory = inventoryMap[sku] || { qty: 0, is_in_stock: false };

    // Extract category objects from custom attributes
    let categoryObjects = [];
    if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
      product.custom_attributes.forEach((attr) => {
        if (attr.attribute_code === 'category_ids' && attr.value) {
          try {
            const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
            categoryObjects = ids
              .map((id) => categoryMap[id.toString()])
              .filter((cat) => cat)
              .map((cat) => ({ id: cat.id, name: cat.name }));
          } catch (e) {
            // Skip invalid category data
          }
        }
      });
    }

    // Sort media_gallery_entries to prioritize AEM URLs
    let sortedMediaGallery = [];
    if (product.media_gallery_entries && Array.isArray(product.media_gallery_entries)) {
      sortedMediaGallery = [...product.media_gallery_entries].sort((a, b) => {
        const aIsUrl = a.file && a.file.startsWith('http');
        const bIsUrl = b.file && b.file.startsWith('http');

        // AEM URLs (starting with http) should come first
        if (aIsUrl && !bIsUrl) return -1;
        if (!aIsUrl && bIsUrl) return 1;

        // If both are URLs or both are paths, maintain original order
        return 0;
      });
    }

    // Return RAW consolidated data - let buildProducts step handle transformation
    return {
      ...product,
      qty: inventory.qty,
      categories: categoryObjects, // Raw category objects with id/name
      inventory: inventory,
      media_gallery_entries: sortedMediaGallery, // AEM URLs prioritized over catalog paths
    };
  });
}

// =============================================================================
// PERFORMANCE TRACKING
// =============================================================================

function initializePerformanceTracking() {
  return {
    processedProducts: 0,
    apiCalls: 0,
    productsApiCalls: 0,
    categoriesApiCalls: 0,
    inventoryApiCalls: 0,
    totalApiCalls: 0,
    uniqueCategories: 0,
    productCount: 0,
    skuCount: 0,
    method: 'API Mesh (Template-Generated)',
    executionTime: 0,
    clientCalls: 1,
    dataSourcesUnified: 3, // Products, Categories, Inventory
    queryConsolidation: '1:1', // Single query to orchestrator
    cacheHitRate: 0,
    categoriesCached: 0,
    categoriesFetched: 0,
    operationComplexity: 'single-query',
    dataFreshness: 'real-time',
    clientComplexity: 'minimal',
    apiOrchestration: 'automated',
    parallelization: 'automatic',
    meshOptimizations: ['Template-Generated', 'Query Consolidation'],
  };
}

function calculatePerformanceMetrics(performance, categoryIds, skus, startTime) {
  const endTime = Date.now();
  performance.executionTime = (endTime - startTime) / 1000;
  performance.productCount = performance.processedProducts;
  performance.skuCount = skus.length;
  performance.uniqueCategories = categoryIds.size;

  return performance;
}

// =============================================================================
// GRAPHQL RESOLVER
// =============================================================================

module.exports = {
  resolvers: {
    Query: {
      mesh_products_enriched: {
        resolve: async (parent, args, context) => {
          try {
            const startTime = Date.now();
            const pageSize = args.pageSize || 150;
            const maxPages = 25;

            // Initialize performance tracking (like master branch)
            const performance = {
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
              clientCalls: 1,
              dataSourcesUnified: 0,
              queryConsolidation: null,
              cacheHitRate: 0,
              categoriesCached: 0,
              categoriesFetched: 0,
              operationComplexity: 'single-query',
              dataFreshness: 'real-time',
              clientComplexity: 'minimal',
              apiOrchestration: 'automated',
              parallelization: 'automatic',
              meshOptimizations: [],
            };

            // Extract admin token from context headers (secure approach)
            context.adminToken = context.headers['x-commerce-admin-token'];

            // Step 1: Fetch all products using OAuth (like master branch)
            console.log(
              '🚀 Starting fetchAllProducts with pageSize:',
              pageSize,
              'maxPages:',
              maxPages
            );

            let allProducts = [];
            let fetchError = null;
            try {
              allProducts = await fetchAllProducts(context, pageSize, maxPages, performance);
              console.log('📦 fetchAllProducts returned:', allProducts.length, 'products');
            } catch (error) {
              console.log('❌ fetchAllProducts failed:', error.message);
              fetchError = error;
              allProducts = []; // Ensure empty array
            }

            // Step 2: Extract category IDs and SKUs
            const categoryIds = new Set();
            const skus = [];

            allProducts.forEach((product) => {
              // Extract SKUs
              if (product.sku) {
                skus.push(product.sku);
              }

              // Extract category IDs from custom attributes
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

            // Step 3: Fetch category and inventory data in parallel (hybrid auth)
            const [categoryMap, inventoryMap] = await Promise.all([
              fetchCategoriesData(context, Array.from(categoryIds), performance),
              fetchInventoryData(context, skus, performance),
            ]);

            // Step 4: Enrich products with consolidated data
            const enrichedProducts = allProducts.map((product) => {
              const inventory = inventoryMap[product.sku] || { qty: 0, is_in_stock: false };

              // Get category objects for this product
              const categoryObjects = [];
              if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
                product.custom_attributes.forEach((attr) => {
                  if (attr.attribute_code === 'category_ids' && attr.value) {
                    try {
                      const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
                      categoryObjects.push(
                        ...ids
                          .map((id) => categoryMap[id.toString()])
                          .filter(Boolean)
                          .map((cat) => ({ id: cat.id, name: cat.name }))
                      );
                    } catch (e) {
                      // Skip invalid category data
                    }
                  }
                });
              }

              // Return RAW consolidated data - let buildProducts step handle transformation
              let sortedMediaGallery = [];
              if (product.media_gallery_entries && Array.isArray(product.media_gallery_entries)) {
                sortedMediaGallery = [...product.media_gallery_entries].sort((a, b) => {
                  const aIsUrl = a.file && a.file.startsWith('http');
                  const bIsUrl = b.file && b.file.startsWith('http');
                  if (aIsUrl && !bIsUrl) return -1;
                  if (!aIsUrl && bIsUrl) return 1;
                  return 0;
                });
              }

              return {
                ...product,
                qty: inventory.qty,
                categories: categoryObjects,
                inventory: inventory,
                media_gallery_entries: sortedMediaGallery,
              };
            });

            // Calculate final performance metrics
            const endTime = Date.now();
            performance.executionTime = (endTime - startTime) / 1000;
            performance.processedProducts = enrichedProducts.length;
            performance.productCount = enrichedProducts.length;
            performance.skuCount = skus.length;
            performance.uniqueCategories = categoryIds.size;

            // Calculate dynamic client-perspective efficiency metrics
            let sourcesUsed = 0;
            if (performance.productsApiCalls > 0) sourcesUsed++;
            if (performance.categoriesApiCalls > 0 || performance.categoriesCached > 0)
              sourcesUsed++;
            if (performance.inventoryApiCalls > 0) sourcesUsed++;
            performance.dataSourcesUnified = sourcesUsed;

            const actualMeshCalls = performance.totalApiCalls || performance.apiCalls;
            performance.queryConsolidation = actualMeshCalls + ':1';

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

            return {
              products: enrichedProducts,
              total_count: enrichedProducts.length,
              message:
                'Successfully fetched ' +
                enrichedProducts.length +
                ' products with category and inventory data',
              status: 'success',
              performance: performance,
              debug: {
                resolverCalled: true,
                hasContext: !!context,
                hasHeaders: !!context.headers,
                oauthConsumerKey: context.headers['x-commerce-consumer-key']
                  ? 'PRESENT'
                  : 'MISSING',
                adminUsername: context.adminCredentials?.username ? 'PRESENT' : 'MISSING',
                timestamp: new Date().toISOString(),
                productsCount: allProducts.length,
                categoriesCount: Object.keys(categoryMap).length,
                inventoryCount: Object.keys(inventoryMap).length,
                hasOAuthCredentials: !!context.headers['x-commerce-consumer-key'],
                hasAdminCredentials: !!context.adminCredentials?.username,
                errorType: fetchError ? fetchError.name : null,
                errorMessage: fetchError ? fetchError.message : null,
              },
            };
          } catch (error) {
            console.error('Mesh resolver error:', error);
            throw new Error('Failed to fetch enriched products: ' + error.message);
          }
        },
      },
    },
  },
};
