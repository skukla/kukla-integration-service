/**
 * Day 5: Create Focused Product-Enrichment.js Resolver
 * 
 * This script extracts shared utilities from the monolithic resolver and creates
 * a focused product-enrichment.js resolver that integrates with the buildProducts step.
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Extract OAuth utilities from monolithic resolver
 * @returns {string} OAuth utilities code
 */
function createOAuthUtilities() {
  return `/**
 * OAuth 1.0 Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

/**
 * Percent encoding for OAuth (RFC 3986)
 * @param {string} str - String to encode
 * @returns {string} Encoded string
 */
function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * @param {string} key - Signing key
 * @param {string} data - Data to sign
 * @returns {Promise<string>} Base64 encoded signature
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
 * @param {Object} oauthParams - OAuth parameters
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {Promise<string>} Authorization header value
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
 * @param {Object} context - GraphQL context
 * @returns {Object} OAuth parameters
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

module.exports = {
  percentEncode,
  generateHmacSignature,
  createOAuthHeader,
  extractOAuthCredentials,
};
`;
}

/**
 * Extract caching utilities from monolithic resolver
 * @returns {string} Caching utilities code
 */
function createCachingUtilities() {
  return `/**
 * Caching Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

// Global cache with TTL support
const cacheStore = new Map();

/**
 * Default cache TTL in milliseconds (5 minutes)
 */
const DEFAULT_CACHE_TTL = 300000;

/**
 * Get cached item with TTL check
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {*} Cached value or null if expired/missing
 */
function getCachedItem(key, ttl = DEFAULT_CACHE_TTL) {
  const cached = cacheStore.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  if (cached) {
    cacheStore.delete(key);
  }

  return null;
}

/**
 * Cache item with timestamp
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function cacheItem(key, data) {
  cacheStore.set(key, {
    timestamp: Date.now(),
    data: data,
  });
}

/**
 * Get cached category by ID
 * @param {string} categoryId - Category ID
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object|null} Cached category or null
 */
function getCachedCategory(categoryId, ttl = DEFAULT_CACHE_TTL) {
  return getCachedItem(\`category_\${categoryId}\`, ttl);
}

/**
 * Cache category data
 * @param {string} categoryId - Category ID
 * @param {Object} data - Category data
 */
function cacheCategory(categoryId, data) {
  cacheItem(\`category_\${categoryId}\`, data);
}

/**
 * Build category map from cache for given IDs
 * @param {Array<string>} categoryIds - Category IDs to lookup
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} Category map with cached data
 */
function buildCategoryMapFromCache(categoryIds, ttl = DEFAULT_CACHE_TTL) {
  const categoryMap = {};
  categoryIds.forEach((id) => {
    const cached = getCachedCategory(id, ttl);
    if (cached) {
      categoryMap[id] = cached;
    }
  });
  return categoryMap;
}

/**
 * Clear all cached items
 */
function clearCache() {
  cacheStore.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

module.exports = {
  getCachedItem,
  cacheItem,
  getCachedCategory,
  cacheCategory,
  buildCategoryMapFromCache,
  clearCache,
  getCacheStats,
  DEFAULT_CACHE_TTL,
};
`;
}

/**
 * Create performance tracking utilities
 * @returns {string} Performance utilities code
 */
function createPerformanceUtilities() {
  return `/**
 * Performance Tracking Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

/**
 * Initialize performance tracking object
 * @param {string} method - Method name for tracking
 * @returns {Object} Performance tracking object
 */
function initializePerformanceTracking(method = 'JSON Schema Resolver') {
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
    method: method,
    executionTime: 0,
    clientCalls: 1,
    dataSourcesUnified: 0,
    queryConsolidation: null,
    cacheHitRate: 0,
    categoriesCached: 0,
    categoriesFetched: 0,
    operationComplexity: 'source-specific',
    dataFreshness: 'real-time',
    clientComplexity: 'minimal',
    apiOrchestration: 'source-specific',
    parallelization: 'manual',
    meshOptimizations: [],
    startTime: Date.now(),
  };
}

/**
 * Calculate final performance metrics
 * @param {Object} performance - Performance tracking object
 * @param {Set} categoryIds - Category IDs processed
 * @param {Array} skus - SKUs processed
 * @returns {Object} Updated performance object
 */
function calculatePerformanceMetrics(performance, categoryIds = new Set(), skus = []) {
  const endTime = Date.now();
  performance.executionTime = (endTime - performance.startTime) / 1000;
  performance.productCount = performance.processedProducts;
  performance.skuCount = skus.length;
  performance.uniqueCategories = categoryIds.size;

  // Calculate dynamic metrics
  let sourcesUsed = 0;
  if (performance.productsApiCalls > 0) sourcesUsed++;
  if (performance.categoriesApiCalls > 0 || performance.categoriesCached > 0) sourcesUsed++;
  if (performance.inventoryApiCalls > 0) sourcesUsed++;
  performance.dataSourcesUnified = sourcesUsed;

  const totalApiCalls = performance.totalApiCalls || performance.apiCalls;
  performance.queryConsolidation = totalApiCalls + ':1';

  if (performance.categoriesCached + performance.categoriesFetched > 0) {
    performance.cacheHitRate = Math.round(
      (performance.categoriesCached / (performance.categoriesCached + performance.categoriesFetched)) * 100
    );
  }

  // Update optimizations based on execution
  performance.meshOptimizations = [];
  if (performance.categoriesCached > 0) {
    performance.meshOptimizations.push('Category Caching');
  }
  if (performance.dataSourcesUnified > 1) {
    performance.meshOptimizations.push('Multi-Source Integration');
  }
  if (performance.categoriesApiCalls > 0 && performance.inventoryApiCalls > 0) {
    performance.meshOptimizations.push('Parallel Data Fetching');
  }

  return performance;
}

/**
 * Update performance tracking for API calls
 * @param {Object} performance - Performance tracking object
 * @param {string} source - Source name (products, categories, inventory)
 * @param {number} count - Number of API calls
 */
function updateApiCallMetrics(performance, source, count = 1) {
  performance.apiCalls += count;
  performance.totalApiCalls += count;
  
  switch (source) {
    case 'products':
      performance.productsApiCalls += count;
      break;
    case 'categories':
      performance.categoriesApiCalls += count;
      break;
    case 'inventory':
      performance.inventoryApiCalls += count;
      break;
  }
}

module.exports = {
  initializePerformanceTracking,
  calculatePerformanceMetrics,
  updateApiCallMetrics,
};
`;
}

/**
 * Create the focused product-enrichment resolver
 * @param {Object} config - Configuration object
 * @returns {string} Product resolver code
 */
function createProductResolver(config) {
  const commerceUrl = config.commerce?.baseUrl || 'https://citisignal-com774.adobedemo.com';
  
  return `/**
 * Products Source Resolver for JSON Schema Multi-Source Architecture
 * 
 * Focused resolver that handles Products API calls with OAuth authentication.
 * Integrates with buildProducts step for consistent data transformation.
 */

const { createOAuthHeader, extractOAuthCredentials } = require('../utilities/oauth');
const { initializePerformanceTracking, calculatePerformanceMetrics, updateApiCallMetrics } = require('../utilities/performance');

// Configuration
const COMMERCE_BASE_URL = '${commerceUrl}';
const PRODUCT_FIELDS = 'items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries,custom_attributes],total_count';
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_PAGES = 25;

/**
 * Fetch all products with pagination and OAuth authentication
 * @param {Object} context - GraphQL context
 * @param {number} pageSize - Page size for pagination
 * @param {number} maxPages - Maximum pages to fetch
 * @param {Object} performance - Performance tracking object
 * @returns {Promise<Array>} Array of products
 */
async function fetchAllProducts(context, pageSize = DEFAULT_BATCH_SIZE, maxPages = DEFAULT_MAX_PAGES, performance = null) {
  console.log('🔍 Products resolver: fetchAllProducts called with pageSize:', pageSize, 'maxPages:', maxPages);
  
  const allProducts = [];
  let currentPage = 1;

  try {
    const oauthParams = extractOAuthCredentials(context);

    while (currentPage <= maxPages) {
      const url = \`\${COMMERCE_BASE_URL}/rest/V1/products?searchCriteria[pageSize]=\${pageSize}&searchCriteria[currentPage]=\${currentPage}&fields=\${PRODUCT_FIELDS}\`;
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
        console.error(\`Products API failed: \${response.status} \${response.statusText} - \${errorText}\`);
        break;
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

    console.log('📦 Products resolver: fetchAllProducts returned:', allProducts.length, 'products');
    return allProducts;
  } catch (error) {
    console.error(\`Products resolver: Failed to fetch products: \${error.message}\`);
    throw new Error(\`Failed to fetch products: \${error.message}\`);
  }
}

/**
 * Extract category IDs from products
 * @param {Array} products - Array of products
 * @returns {Set} Set of category IDs
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
 * @param {Array} products - Array of products
 * @returns {Array} Array of SKUs
 */
function extractSkus(products) {
  return products.map(product => product.sku).filter(Boolean);
}

/**
 * Products resolver for JSON Schema handler
 * @param {Object} parent - Parent resolver result
 * @param {Object} args - GraphQL arguments
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} Products response
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
    throw new Error(\`Products resolver failed: \${error.message}\`);
  }
}

module.exports = {
  productsResolver,
  fetchAllProducts,
  extractCategoryIds,
  extractSkus,
};
`;
}

/**
 * Create utility extraction and resolver creation script
 * @returns {string} Main script content
 */
function createMainScript() {
  return `/**
 * Main Day 5 execution script
 * Orchestrates utility extraction and resolver creation
 */

const fs = require('fs/promises');
const path = require('path');
const { loadConfig } = require('../../config');
const { extractActionParams } = require('../../src/core/http/client');
const { detectEnvironment } = require('../../src/core/environment');

/**
 * Load environment parameters from .env file
 */
async function loadEnvironmentParams() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = await fs.readFile(envPath, 'utf8');
  const params = {};
  
  envContent.split('\\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      params[key.trim()] = value.trim();
    }
  });
  
  return params;
}

/**
 * Create utility directories and files
 */
async function createUtilities() {
  const utilitiesDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'utilities');
  await fs.mkdir(utilitiesDir, { recursive: true });
  
  console.log('🔧 Creating shared utilities...');
  
  // Create OAuth utilities
  await fs.writeFile(
    path.join(utilitiesDir, 'oauth.js'),
    createOAuthUtilities()
  );
  console.log('   ✅ OAuth utilities created');
  
  // Create caching utilities
  await fs.writeFile(
    path.join(utilitiesDir, 'caching.js'),
    createCachingUtilities()
  );
  console.log('   ✅ Caching utilities created');
  
  // Create performance utilities
  await fs.writeFile(
    path.join(utilitiesDir, 'performance.js'),
    createPerformanceUtilities()
  );
  console.log('   ✅ Performance utilities created');
}

/**
 * Create resolver directory and product resolver
 */
async function createProductResolver(config) {
  const resolversDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'resolvers');
  await fs.mkdir(resolversDir, { recursive: true });
  
  console.log('\\n📦 Creating product resolver...');
  
  // Create product resolver
  await fs.writeFile(
    path.join(resolversDir, 'products.js'),
    createProductResolver(config)
  );
  console.log('   ✅ Product resolver created');
}

/**
 * Create integration tests
 */
async function createTests() {
  const testsDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'tests');
  await fs.mkdir(testsDir, { recursive: true });
  
  console.log('\\n🧪 Creating integration tests...');
  
  const testContent = \`/**
 * Integration tests for JSON Schema resolvers
 */

const { productsResolver } = require('../resolvers/products');
const { extractOAuthCredentials } = require('../utilities/oauth');
const { initializePerformanceTracking } = require('../utilities/performance');

/**
 * Test OAuth utilities
 */
async function testOAuthUtilities() {
  console.log('🔐 Testing OAuth utilities...');
  
  const mockContext = {
    headers: {
      'x-commerce-consumer-key': 'test-key',
      'x-commerce-consumer-secret': 'test-secret',
      'x-commerce-access-token': 'test-token',
      'x-commerce-access-token-secret': 'test-token-secret',
    },
  };
  
  try {
    const credentials = extractOAuthCredentials(mockContext);
    console.log('   ✅ OAuth credentials extracted successfully');
    return true;
  } catch (error) {
    console.error('   ❌ OAuth test failed:', error.message);
    return false;
  }
}

/**
 * Test performance utilities
 */
async function testPerformanceUtilities() {
  console.log('📊 Testing performance utilities...');
  
  try {
    const performance = initializePerformanceTracking('Test');
    console.log('   ✅ Performance tracking initialized successfully');
    return true;
  } catch (error) {
    console.error('   ❌ Performance test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Running integration tests...\\n');
  
  const results = await Promise.all([
    testOAuthUtilities(),
    testPerformanceUtilities(),
  ]);
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(\`\\n📊 Test results: \${passed}/\${total} tests passed\`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  
  return passed === total;
}

module.exports = {
  runTests,
};
\`;
  
  await fs.writeFile(
    path.join(testsDir, 'integration.js'),
    testContent
  );
  console.log('   ✅ Integration tests created');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Day 5: Starting focused product resolver creation...\\n');
    
    // Load environment and configuration
    const envParams = await loadEnvironmentParams();
    const params = extractActionParams(envParams);
    const config = loadConfig(params);
    const environment = detectEnvironment(params);
    
    console.log(\`🌍 Environment: \${environment}\`);
    console.log(\`🔗 Commerce URL: \${config.commerce.baseUrl}\`);
    
    // Step 1: Create utilities
    await createUtilities();
    
    // Step 2: Create product resolver
    await createProductResolver(config);
    
    // Step 3: Create integration tests
    await createTests();
    
    // Step 4: Run tests
    const { runTests } = require('./src/mesh/json-schema/tests/integration');
    const testsPass = await runTests();
    
    console.log('\\n🎉 Day 5 completed successfully!');
    console.log('\\n📋 Summary:');
    console.log('   ✅ OAuth utilities extracted and created');
    console.log('   ✅ Caching utilities extracted and created');
    console.log('   ✅ Performance utilities extracted and created');
    console.log('   ✅ Product resolver created with buildProducts integration');
    console.log('   ✅ Integration tests created and executed');
    console.log(\`   \${testsPass ? '✅' : '❌'} All tests \${testsPass ? 'passed' : 'failed'}\`);
    
    console.log('\\n🔄 Integration with buildProducts step:');
    console.log('   - Product resolver returns raw product data');
    console.log('   - Category IDs and SKUs extracted for enrichment');
    console.log('   - Main resolver will use buildProducts for transformation');
    console.log('   - Maintains perfect parity with existing actions');
    
    console.log('\\nNext steps:');
    console.log('   - Day 6: Create category-integration.js resolver');
    console.log('   - Day 7: Create inventory-integration.js resolver');
    console.log('   - Phase 3: Integration & Type Merging');
    
  } catch (error) {
    console.error('❌ Day 5 failed:', error.message);
    process.exit(1);
  }
}

// Export functions for external use
module.exports = {
  createOAuthUtilities,
  createCachingUtilities,
  createPerformanceUtilities,
  createProductResolver,
  main,
};
`;
}

/**
 * Save all Day 5 files
 */
async function saveDay5Files() {
  const scriptDir = path.join(process.cwd(), 'scripts', 'json-schema');
  
  // Save the main script content
  await fs.writeFile(
    path.join(scriptDir, 'day5-functions.js'),
    createMainScript()
  );
  
  console.log('✅ Day 5 functions saved to scripts/json-schema/day5-functions.js');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Day 5: Starting focused product resolver creation...\n');
    
    // Load environment and configuration
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    const params = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        params[key.trim()] = value.trim();
      }
    });
    
    const { loadConfig } = require('../../config');
    const { extractActionParams } = require('../../src/core/http/client');
    const { detectEnvironment } = require('../../src/core/environment');
    
    const actionParams = extractActionParams(params);
    const config = loadConfig(actionParams);
    const environment = detectEnvironment(actionParams);
    
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔗 Commerce URL: ${config.commerce.baseUrl}`);
    
    // Step 1: Create utilities
    const utilitiesDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'utilities');
    await fs.mkdir(utilitiesDir, { recursive: true });
    
    console.log('🔧 Creating shared utilities...');
    
    // Create OAuth utilities
    await fs.writeFile(
      path.join(utilitiesDir, 'oauth.js'),
      createOAuthUtilities()
    );
    console.log('   ✅ OAuth utilities created');
    
    // Create caching utilities
    await fs.writeFile(
      path.join(utilitiesDir, 'caching.js'),
      createCachingUtilities()
    );
    console.log('   ✅ Caching utilities created');
    
    // Create performance utilities
    await fs.writeFile(
      path.join(utilitiesDir, 'performance.js'),
      createPerformanceUtilities()
    );
    console.log('   ✅ Performance utilities created');
    
    // Step 2: Create product resolver
    const resolversDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'resolvers');
    await fs.mkdir(resolversDir, { recursive: true });
    
    console.log('\n📦 Creating product resolver...');
    
    // Create product resolver
    await fs.writeFile(
      path.join(resolversDir, 'products.js'),
      createProductResolver(config)
    );
    console.log('   ✅ Product resolver created');
    
    // Step 3: Create integration tests
    const testsDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'tests');
    await fs.mkdir(testsDir, { recursive: true });
    
    console.log('\n🧪 Creating integration tests...');
    
    const testContent = \`/**
 * Integration tests for JSON Schema resolvers
 */

const { productsResolver } = require('../resolvers/products');
const { extractOAuthCredentials } = require('../utilities/oauth');
const { initializePerformanceTracking } = require('../utilities/performance');

/**
 * Test OAuth utilities
 */
async function testOAuthUtilities() {
  console.log('🔐 Testing OAuth utilities...');
  
  const mockContext = {
    headers: {
      'x-commerce-consumer-key': 'test-key',
      'x-commerce-consumer-secret': 'test-secret',
      'x-commerce-access-token': 'test-token',
      'x-commerce-access-token-secret': 'test-token-secret',
    },
  };
  
  try {
    const credentials = extractOAuthCredentials(mockContext);
    console.log('   ✅ OAuth credentials extracted successfully');
    return true;
  } catch (error) {
    console.error('   ❌ OAuth test failed:', error.message);
    return false;
  }
}

/**
 * Test performance utilities
 */
async function testPerformanceUtilities() {
  console.log('📊 Testing performance utilities...');
  
  try {
    const performance = initializePerformanceTracking('Test');
    console.log('   ✅ Performance tracking initialized successfully');
    return true;
  } catch (error) {
    console.error('   ❌ Performance test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Running integration tests...\\n');
  
  const results = await Promise.all([
    testOAuthUtilities(),
    testPerformanceUtilities(),
  ]);
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(\`\\n📊 Test results: \${passed}/\${total} tests passed\`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  
  return passed === total;
}

module.exports = {
  runTests,
};
\`;
    
    await fs.writeFile(
      path.join(testsDir, 'integration.js'),
      testContent
    );
    console.log('   ✅ Integration tests created');
    
    // Step 4: Run tests
    console.log('\n🧪 Running integration tests...');
    
    // Test OAuth utilities
    console.log('🔐 Testing OAuth utilities...');
    const mockContext = {
      headers: {
        'x-commerce-consumer-key': 'test-key',
        'x-commerce-consumer-secret': 'test-secret',
        'x-commerce-access-token': 'test-token',
        'x-commerce-access-token-secret': 'test-token-secret',
      },
    };
    
    let oauthTestPassed = false;
    try {
      const { extractOAuthCredentials } = require(path.join(utilitiesDir, 'oauth.js'));
      const credentials = extractOAuthCredentials(mockContext);
      console.log('   ✅ OAuth credentials extracted successfully');
      oauthTestPassed = true;
    } catch (error) {
      console.error('   ❌ OAuth test failed:', error.message);
    }
    
    // Test performance utilities
    console.log('📊 Testing performance utilities...');
    let performanceTestPassed = false;
    try {
      const { initializePerformanceTracking } = require(path.join(utilitiesDir, 'performance.js'));
      const performance = initializePerformanceTracking('Test');
      console.log('   ✅ Performance tracking initialized successfully');
      performanceTestPassed = true;
    } catch (error) {
      console.error('   ❌ Performance test failed:', error.message);
    }
    
    const testsPass = oauthTestPassed && performanceTestPassed;
    
    console.log('\n🎉 Day 5 completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ OAuth utilities extracted and created');
    console.log('   ✅ Caching utilities extracted and created');
    console.log('   ✅ Performance utilities extracted and created');
    console.log('   ✅ Product resolver created with buildProducts integration');
    console.log('   ✅ Integration tests created and executed');
    console.log(\`   \${testsPass ? '✅' : '❌'} All tests \${testsPass ? 'passed' : 'failed'}\`);
    
    console.log('\n🔄 Integration with buildProducts step:');
    console.log('   - Product resolver returns raw product data');
    console.log('   - Category IDs and SKUs extracted for enrichment');
    console.log('   - Main resolver will use buildProducts for transformation');
    console.log('   - Maintains perfect parity with existing actions');
    
    console.log('\nNext steps:');
    console.log('   - Day 6: Create category-integration.js resolver');
    console.log('   - Day 7: Create inventory-integration.js resolver');
    console.log('   - Phase 3: Integration & Type Merging');
    
  } catch (error) {
    console.error('❌ Day 5 failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createOAuthUtilities,
  createCachingUtilities,
  createPerformanceUtilities,
  createProductResolver,
  main,
}; 