/**
 * Merged Resolvers for JSON Schema Multi-Source Architecture
 * 
 * Handles complex type merging logic that cannot be handled by automatic transforms.
 * Implements SKU-based merging with error handling and performance optimization.
 */

const { productsResolver } = require('./resolvers/products');
const { categoriesResolver } = require('./resolvers/categories');
const { inventoryResolver } = require('./resolvers/inventory');

/**
 * Merge product data from multiple sources based on SKU
 */
async function mergeProductData(context, skus, options = {}) {
  const { includeCategories = true, includeInventory = true } = options;
  
  const results = await Promise.all([
    // Get products data
    productsResolver(null, { skus }, context),
    
    // Get categories data if requested
    includeCategories ? categoriesResolver(null, { operation: 'batch', categoryIds: [] }, context) : null,
    
    // Get inventory data if requested
    includeInventory ? inventoryResolver(null, { operation: 'batch', skus }, context) : null,
  ]);
  
  const [productsResult, categoriesResult, inventoryResult] = results;
  
  // Merge data based on SKU
  const mergedProducts = productsResult.data.products.map(product => {
    const merged = {
      ...product,
      data_sources: ['Products'],
      merge_status: 'success',
    };
    
    // Add category data if available
    if (categoriesResult && categoriesResult.data) {
      // Extract category IDs from product custom attributes
      const categoryIds = extractCategoryIds(product);
      merged.categories = categoryIds.map(id => categoriesResult.data[id]).filter(Boolean);
      if (merged.categories.length > 0) {
        merged.data_sources.push('Categories');
      }
    }
    
    // Add inventory data if available
    if (inventoryResult && inventoryResult.data && inventoryResult.data[product.sku]) {
      const inventory = inventoryResult.data[product.sku];
      merged.inventory = inventory;
      merged.qty = inventory.qty;
      merged.is_in_stock = inventory.is_in_stock;
      merged.data_sources.push('Inventory');
    }
    
    return merged;
  });
  
  return {
    products: mergedProducts,
    total_count: mergedProducts.length,
    merge_statistics: calculateMergeStatistics(mergedProducts),
    performance: calculateMergePerformance(results),
  };
}

/**
 * Extract category IDs from product custom attributes
 */
function extractCategoryIds(product) {
  const categoryIds = [];
  
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    product.custom_attributes.forEach(attr => {
      if (attr.attribute_code === 'category_ids' && attr.value) {
        try {
          const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
          categoryIds.push(...ids.map(id => id.toString()));
        } catch (e) {
          // Skip invalid category IDs
        }
      }
    });
  }
  
  return categoryIds;
}

/**
 * Calculate merge statistics
 */
function calculateMergeStatistics(mergedProducts) {
  const stats = {
    products_processed: mergedProducts.length,
    categories_merged: 0,
    inventory_merged: 0,
    successful_merges: 0,
    failed_merges: 0,
    missing_categories: 0,
    missing_inventory: 0,
  };
  
  mergedProducts.forEach(product => {
    if (product.merge_status === 'success') {
      stats.successful_merges++;
    } else {
      stats.failed_merges++;
    }
    
    if (product.categories && product.categories.length > 0) {
      stats.categories_merged++;
    } else {
      stats.missing_categories++;
    }
    
    if (product.inventory) {
      stats.inventory_merged++;
    } else {
      stats.missing_inventory++;
    }
  });
  
  return stats;
}

/**
 * Calculate merge performance metrics
 */
function calculateMergePerformance(results) {
  const performance = {
    execution_time: 0,
    merge_time: 0,
    source_queries: results.length,
    cache_hits: 0,
    cache_misses: 0,
    total_api_calls: 0,
  };
  
  results.forEach(result => {
    if (result && result.performance) {
      performance.total_api_calls += result.performance.apiCalls || 0;
      performance.cache_hits += result.performance.cacheHits || 0;
      performance.cache_misses += result.performance.cacheMisses || 0;
    }
  });
  
  return performance;
}

/**
 * Main merged resolvers
 */
const mergedResolvers = {
  Query: {
    products_enriched: async (parent, args, context) => {
      const { pageSize = 20, maxPages = 25, includeCategories = true, includeInventory = true } = args;
      
      // Get products first to determine SKUs
      const productsResult = await productsResolver(null, { pageSize, maxPages }, context);
      
      if (!productsResult.data || !productsResult.data.products) {
        return {
          products: [],
          total_count: 0,
          merge_statistics: calculateMergeStatistics([]),
          performance: calculateMergePerformance([]),
        };
      }
      
      const skus = productsResult.data.products.map(p => p.sku);
      
      return await mergeProductData(context, skus, { includeCategories, includeInventory });
    },
    
    product_enriched: async (parent, args, context) => {
      const { sku, includeCategories = true, includeInventory = true } = args;
      
      const result = await mergeProductData(context, [sku], { includeCategories, includeInventory });
      
      return result.products[0] || null;
    },
    
    merge_debug: async (parent, args, context) => {
      const { sku, showSources = false } = args;
      
      const debug = {
        sku,
        sources_available: [],
        merge_status: 'unknown',
        category_merge_status: 'unknown',
        inventory_merge_status: 'unknown',
        errors: [],
        warnings: [],
      };
      
      try {
        // Test each source
        const tests = await Promise.all([
          productsResolver(null, { skus: [sku] }, context).catch(e => ({ error: e.message })),
          categoriesResolver(null, { operation: 'list' }, context).catch(e => ({ error: e.message })),
          inventoryResolver(null, { operation: 'by_sku', sku }, context).catch(e => ({ error: e.message })),
        ]);
        
        if (!tests[0].error) debug.sources_available.push('Products');
        if (!tests[1].error) debug.sources_available.push('Categories');
        if (!tests[2].error) debug.sources_available.push('Inventory');
        
        debug.merge_status = debug.sources_available.length > 0 ? 'available' : 'failed';
        debug.category_merge_status = debug.sources_available.includes('Categories') ? 'available' : 'unavailable';
        debug.inventory_merge_status = debug.sources_available.includes('Inventory') ? 'available' : 'unavailable';
        
        tests.forEach((test, index) => {
          if (test.error) {
            debug.errors.push(`Source ${index}: ${test.error}`);
          }
        });
        
      } catch (error) {
        debug.errors.push('Debug test failed: ' + error.message);
        debug.merge_status = 'error';
      }
      
      return debug;
    },
  },
};

module.exports = mergedResolvers;
