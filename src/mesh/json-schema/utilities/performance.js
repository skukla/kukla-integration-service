/**
 * Performance Tracking Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

/**
 * Initialize performance tracking object
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
