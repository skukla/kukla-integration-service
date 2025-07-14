/**
 * Categories Source Resolver for JSON Schema Multi-Source Architecture
 * 
 * Focused resolver that handles Categories API calls with OAuth authentication
 * and intelligent caching strategy for category relationships.
 * 
 * Key Features:
 * - OAuth 1.0 authentication for all category API calls
 * - TTL-based caching with relationship awareness
 * - Batch fetching for efficiency
 * - Tree and list operations support
 * - Individual category lookup with caching
 */

const { createOAuthHeader, extractOAuthCredentials } = require('../utilities/oauth');
const { getCachedCategory, cacheCategory, buildCategoryMapFromCache } = require('../utilities/caching');
const { initializePerformanceTracking, calculatePerformanceMetrics, updateApiCallMetrics } = require('../utilities/performance');

// Configuration
const COMMERCE_BASE_URL = 'https://citisignal-com774.adobedemo.com';
const DEFAULT_BATCH_SIZE = 10; // Categories are fetched individually, smaller batch
const DEFAULT_CACHE_TTL = 300000; // 5 minutes for categories
const TREE_CACHE_TTL = 600000; // 10 minutes for category trees (more stable)

/**
 * Fetch individual category by ID with caching
 */
async function fetchCategoryById(context, categoryId, performance = null) {
  console.log('🔍 Categories resolver: fetchCategoryById called with ID:', categoryId);
  
  // Check cache first
  const cached = getCachedCategory(categoryId, DEFAULT_CACHE_TTL);
  if (cached) {
    console.log('📦 Categories resolver: Cache hit for category ID:', categoryId);
    return cached;
  }

  try {
    const oauthParams = extractOAuthCredentials(context);
    const url = COMMERCE_BASE_URL + '/rest/V1/categories/' + categoryId;
    const authHeader = await createOAuthHeader(oauthParams, 'GET', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (performance) {
      updateApiCallMetrics(performance, 'categories', 1);
    }

    if (!response.ok) {
      console.warn('Categories API failed for ID ' + categoryId + ': ' + response.status + ' ' + response.statusText);
      return null;
    }

    const category = await response.json();
    cacheCategory(categoryId, category);
    
    console.log('✅ Categories resolver: Successfully fetched category ID:', categoryId);
    return category;
  } catch (error) {
    console.error('Categories resolver: Failed to fetch category ID ' + categoryId + ': ' + error.message);
    return null;
  }
}

/**
 * Fetch multiple categories with batch processing and caching
 */
async function fetchCategoriesData(context, categoryIds, performance = null) {
  console.log('🔍 Categories resolver: fetchCategoriesData called with IDs:', categoryIds.length);
  
  const categoryMap = {};

  if (categoryIds.length === 0) {
    return categoryMap;
  }

  // Get cached categories first
  const cachedCategories = buildCategoryMapFromCache(categoryIds, DEFAULT_CACHE_TTL);
  Object.assign(categoryMap, cachedCategories);

  // Find uncached category IDs
  const uncachedIds = categoryIds.filter((id) => !getCachedCategory(id, DEFAULT_CACHE_TTL));

  if (uncachedIds.length === 0) {
    console.log('📦 Categories resolver: All categories found in cache');
    return categoryMap;
  }

  console.log('🔍 Categories resolver: Fetching uncached categories:', uncachedIds.length);

  try {
    // Process in batches for efficiency
    for (let i = 0; i < uncachedIds.length; i += DEFAULT_BATCH_SIZE) {
      const batch = uncachedIds.slice(i, i + DEFAULT_BATCH_SIZE);

      const promises = batch.map(async (categoryId) => {
        const category = await fetchCategoryById(context, categoryId, performance);
        return category ? { id: categoryId, data: category } : null;
      });

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result && result.data) {
          categoryMap[result.id] = result.data;
        }
      });
    }

    console.log('✅ Categories resolver: Successfully fetched', Object.keys(categoryMap).length, 'categories');
    return categoryMap;
  } catch (error) {
    console.error('Categories resolver: Failed to fetch categories: ' + error.message);
    throw new Error('Failed to fetch categories: ' + error.message);
  }
}

/**
 * Fetch category tree with extended caching
 */
async function fetchCategoryTree(context, rootCategoryId = 1, performance = null) {
  console.log('🔍 Categories resolver: fetchCategoryTree called with rootId:', rootCategoryId);
  
  // Check cache with longer TTL for tree structure
  const treeKey = 'tree_' + rootCategoryId;
  const cached = getCachedCategory(treeKey, TREE_CACHE_TTL);
  if (cached) {
    console.log('📦 Categories resolver: Cache hit for category tree');
    return cached;
  }

  try {
    const oauthParams = extractOAuthCredentials(context);
    const url = COMMERCE_BASE_URL + '/rest/V1/categories';
    const authHeader = await createOAuthHeader(oauthParams, 'GET', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (performance) {
      updateApiCallMetrics(performance, 'categories', 1);
    }

    if (!response.ok) {
      console.error('Categories tree API failed: ' + response.status + ' ' + response.statusText);
      throw new Error('Failed to fetch category tree: ' + response.status);
    }

    const tree = await response.json();
    cacheCategory(treeKey, tree);
    
    console.log('✅ Categories resolver: Successfully fetched category tree');
    return tree;
  } catch (error) {
    console.error('Categories resolver: Failed to fetch category tree: ' + error.message);
    throw new Error('Failed to fetch category tree: ' + error.message);
  }
}

/**
 * Fetch category list with pagination
 */
async function fetchCategoryList(context, pageSize = 50, currentPage = 1, performance = null) {
  console.log('🔍 Categories resolver: fetchCategoryList called with pageSize:', pageSize, 'currentPage:', currentPage);
  
  try {
    const oauthParams = extractOAuthCredentials(context);
    const url = COMMERCE_BASE_URL + '/rest/V1/categories/list?searchCriteria[pageSize]=' + pageSize + '&searchCriteria[currentPage]=' + currentPage;
    const authHeader = await createOAuthHeader(oauthParams, 'GET', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (performance) {
      updateApiCallMetrics(performance, 'categories', 1);
    }

    if (!response.ok) {
      console.error('Categories list API failed: ' + response.status + ' ' + response.statusText);
      throw new Error('Failed to fetch category list: ' + response.status);
    }

    const data = await response.json();
    
    // Cache individual categories from the list
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(category => {
        if (category.id) {
          cacheCategory(category.id, category);
        }
      });
    }
    
    console.log('✅ Categories resolver: Successfully fetched category list with', data.items ? data.items.length : 0, 'items');
    return data;
  } catch (error) {
    console.error('Categories resolver: Failed to fetch category list: ' + error.message);
    throw new Error('Failed to fetch category list: ' + error.message);
  }
}

/**
 * Extract category relationships from category data
 */
function extractCategoryRelationships(categories) {
  const relationships = {
    parentChild: {},
    siblings: {},
    roots: [],
  };

  Object.values(categories).forEach(category => {
    if (category.parent_id) {
      if (!relationships.parentChild[category.parent_id]) {
        relationships.parentChild[category.parent_id] = [];
      }
      relationships.parentChild[category.parent_id].push(category.id);
    } else {
      relationships.roots.push(category.id);
    }
  });

  return relationships;
}

/**
 * Main categories resolver for JSON Schema handler
 */
async function categoriesResolver(parent, args, context) {
  const performance = initializePerformanceTracking('JSON Schema - Categories');
  
  try {
    const operation = args.operation || 'list';
    let result;
    
    switch (operation) {
      case 'tree':
        const rootId = args.rootCategoryId || 1;
        result = await fetchCategoryTree(context, rootId, performance);
        break;
        
      case 'list':
        const pageSize = args.pageSize || 50;
        const currentPage = args.currentPage || 1;
        result = await fetchCategoryList(context, pageSize, currentPage, performance);
        break;
        
      case 'by_id':
        if (!args.categoryId) {
          throw new Error('categoryId is required for by_id operation');
        }
        result = await fetchCategoryById(context, args.categoryId, performance);
        break;
        
      case 'batch':
        if (!args.categoryIds || !Array.isArray(args.categoryIds)) {
          throw new Error('categoryIds array is required for batch operation');
        }
        result = await fetchCategoriesData(context, args.categoryIds, performance);
        break;
        
      default:
        throw new Error('Unknown operation: ' + operation);
    }
    
    // Extract relationships if we have category data
    let relationships = null;
    if (result && typeof result === 'object') {
      if (result.items) {
        // Category list format
        const categoryMap = {};
        result.items.forEach(cat => {
          if (cat.id) categoryMap[cat.id] = cat;
        });
        relationships = extractCategoryRelationships(categoryMap);
      } else if (typeof result === 'object' && !Array.isArray(result)) {
        // Single category or category map
        relationships = extractCategoryRelationships(result.id ? { [result.id]: result } : result);
      }
    }
    
    // Update performance metrics
    const categoryCount = result ? (result.items ? result.items.length : Object.keys(result).length) : 0;
    performance.processedCategories = categoryCount;
    performance.cacheHits = performance.cacheHits || 0;
    performance.cacheMisses = performance.cacheMisses || 0;
    
    console.log('✅ Categories resolver: Successfully completed', operation, 'operation');
    
    return {
      data: result,
      relationships: relationships,
      operation: operation,
      performance: performance,
      source: 'Categories',
      method: 'JSON Schema',
    };
    
  } catch (error) {
    console.error('❌ Categories resolver error:', error);
    throw new Error('Categories resolver failed: ' + error.message);
  }
}

module.exports = {
  categoriesResolver,
  fetchCategoryById,
  fetchCategoriesData,
  fetchCategoryTree,
  fetchCategoryList,
  extractCategoryRelationships,
};
