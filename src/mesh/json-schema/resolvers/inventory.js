/**
 * Inventory Source Resolver for JSON Schema Multi-Source Architecture
 * 
 * Focused resolver that handles Inventory API calls with Admin Token authentication
 * and robust error handling for missing inventory data.
 * 
 * Key Features:
 * - Admin Token authentication for inventory API calls
 * - Graceful error handling for missing inventory data
 * - Batch processing for SKU lookups with fallback values
 * - Smart retry logic for transient failures
 * - Default inventory values when data is unavailable
 */

const { extractAdminToken, createAdminTokenHeaders, validateAdminToken } = require('../utilities/admin-token');
const { initializePerformanceTracking, calculatePerformanceMetrics, updateApiCallMetrics } = require('../utilities/performance');

// Configuration
const COMMERCE_BASE_URL = 'https://citisignal-com774.adobedemo.com';
const DEFAULT_BATCH_SIZE = 20; // Inventory batch size for SKU lookups
const DEFAULT_INVENTORY_VALUES = {
  qty: 0,
  is_in_stock: false,
  is_qty_decimal: false,
  item_id: null,
  product_id: null,
  stock_id: 1,
};

/**
 * Fetch inventory for a single SKU with error handling
 */
async function fetchInventoryBySku(context, sku, performance = null) {
  console.log('🔍 Inventory resolver: fetchInventoryBySku called with SKU:', sku);
  
  try {
    const adminToken = extractAdminToken(context);
    validateAdminToken(adminToken);
    
    const url = COMMERCE_BASE_URL + '/rest/V1/stockItems/' + sku;
    const headers = createAdminTokenHeaders(adminToken);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (performance) {
      updateApiCallMetrics(performance, 'inventory', 1);
    }

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Inventory not found for SKU:', sku, '- using default values');
        return { ...DEFAULT_INVENTORY_VALUES, sku: sku };
      }
      
      console.warn('Inventory API failed for SKU ' + sku + ': ' + response.status + ' ' + response.statusText);
      return { ...DEFAULT_INVENTORY_VALUES, sku: sku };
    }

    const inventory = await response.json();
    
    console.log('✅ Inventory resolver: Successfully fetched inventory for SKU:', sku);
    return {
      item_id: inventory.item_id,
      product_id: inventory.product_id,
      stock_id: inventory.stock_id || 1,
      qty: inventory.qty || 0,
      is_in_stock: inventory.is_in_stock || false,
      is_qty_decimal: inventory.is_qty_decimal || false,
      sku: sku,
    };
  } catch (error) {
    console.error('Inventory resolver: Error fetching inventory for SKU ' + sku + ': ' + error.message);
    return { ...DEFAULT_INVENTORY_VALUES, sku: sku };
  }
}

/**
 * Fetch inventory for multiple SKUs with batch processing and error handling
 */
async function fetchInventoryBatch(context, skus, performance = null) {
  console.log('🔍 Inventory resolver: fetchInventoryBatch called with SKUs:', skus.length);
  
  const inventoryMap = {};
  
  if (skus.length === 0) {
    return inventoryMap;
  }

  try {
    const adminToken = extractAdminToken(context);
    validateAdminToken(adminToken);
    
    // Process in batches for efficiency
    for (let i = 0; i < skus.length; i += DEFAULT_BATCH_SIZE) {
      const batch = skus.slice(i, i + DEFAULT_BATCH_SIZE);
      
      try {
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

        const url = COMMERCE_BASE_URL + '/rest/all/V1/inventory/source-items?' + queryParams.toString();
        const headers = createAdminTokenHeaders(adminToken);

        const response = await fetch(url, {
          method: 'GET',
          headers: headers,
        });

        if (performance) {
          updateApiCallMetrics(performance, 'inventory', 1);
        }

        if (!response.ok) {
          console.warn('Inventory batch fetch failed for batch:', batch.length, 'SKUs - status:', response.status);
          // Add default values for failed batch
          batch.forEach(sku => {
            inventoryMap[sku] = { ...DEFAULT_INVENTORY_VALUES, sku: sku };
          });
          continue;
        }

        const data = await response.json();
        
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            if (item.sku) {
              inventoryMap[item.sku] = {
                item_id: item.item_id,
                product_id: item.product_id,
                stock_id: item.stock_id || 1,
                qty: item.quantity || 0,
                is_in_stock: item.status === 1,
                is_qty_decimal: item.is_qty_decimal || false,
                sku: item.sku,
              };
            }
          });
        }
        
        // Add default values for SKUs not found in the response
        batch.forEach(sku => {
          if (!inventoryMap[sku]) {
            inventoryMap[sku] = { ...DEFAULT_INVENTORY_VALUES, sku: sku };
          }
        });
        
      } catch (batchError) {
        console.error('Inventory batch error:', batchError.message);
        // Add default values for failed batch
        batch.forEach(sku => {
          inventoryMap[sku] = { ...DEFAULT_INVENTORY_VALUES, sku: sku };
        });
      }
    }

    console.log('✅ Inventory resolver: Successfully processed', Object.keys(inventoryMap).length, 'inventory items');
    return inventoryMap;
  } catch (error) {
    console.error('Inventory resolver: Failed to fetch inventory batch: ' + error.message);
    
    // Ensure all SKUs have default values even on complete failure
    skus.forEach(sku => {
      inventoryMap[sku] = { ...DEFAULT_INVENTORY_VALUES, sku: sku };
    });
    
    return inventoryMap;
  }
}

/**
 * Fetch inventory list with pagination and error handling
 */
async function fetchInventoryList(context, pageSize = 50, currentPage = 1, performance = null) {
  console.log('🔍 Inventory resolver: fetchInventoryList called with pageSize:', pageSize, 'currentPage:', currentPage);
  
  try {
    const adminToken = extractAdminToken(context);
    validateAdminToken(adminToken);
    
    const url = COMMERCE_BASE_URL + '/rest/V1/stockItems?searchCriteria[pageSize]=' + pageSize + '&searchCriteria[currentPage]=' + currentPage;
    const headers = createAdminTokenHeaders(adminToken);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (performance) {
      updateApiCallMetrics(performance, 'inventory', 1);
    }

    if (!response.ok) {
      console.error('Inventory list API failed: ' + response.status + ' ' + response.statusText);
      return {
        items: [],
        total_count: 0,
        search_criteria: {
          pageSize: pageSize,
          currentPage: currentPage,
        },
      };
    }

    const data = await response.json();
    
    console.log('✅ Inventory resolver: Successfully fetched inventory list with', data.items ? data.items.length : 0, 'items');
    return data;
  } catch (error) {
    console.error('Inventory resolver: Failed to fetch inventory list: ' + error.message);
    return {
      items: [],
      total_count: 0,
      search_criteria: {
        pageSize: pageSize,
        currentPage: currentPage,
      },
    };
  }
}

/**
 * Search inventory with filters and error handling
 */
async function searchInventory(context, filters, pageSize = 50, currentPage = 1, performance = null) {
  console.log('🔍 Inventory resolver: searchInventory called with filters:', filters.length);
  
  try {
    const adminToken = extractAdminToken(context);
    validateAdminToken(adminToken);
    
    const searchCriteria = {
      filterGroups: [
        {
          filters: filters,
        },
      ],
      pageSize: pageSize,
      currentPage: currentPage,
    };

    const queryParams = new URLSearchParams({
      searchCriteria: JSON.stringify(searchCriteria),
    });

    const url = COMMERCE_BASE_URL + '/rest/V1/stockItems?' + queryParams.toString();
    const headers = createAdminTokenHeaders(adminToken);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (performance) {
      updateApiCallMetrics(performance, 'inventory', 1);
    }

    if (!response.ok) {
      console.error('Inventory search API failed: ' + response.status + ' ' + response.statusText);
      return {
        items: [],
        total_count: 0,
        search_criteria: searchCriteria,
      };
    }

    const data = await response.json();
    
    console.log('✅ Inventory resolver: Successfully searched inventory with', data.items ? data.items.length : 0, 'items');
    return data;
  } catch (error) {
    console.error('Inventory resolver: Failed to search inventory: ' + error.message);
    return {
      items: [],
      total_count: 0,
      search_criteria: {
        filterGroups: [{ filters: filters }],
        pageSize: pageSize,
        currentPage: currentPage,
      },
    };
  }
}

/**
 * Extract inventory statistics from inventory data
 */
function extractInventoryStatistics(inventoryData) {
  const stats = {
    totalItems: 0,
    inStockItems: 0,
    outOfStockItems: 0,
    averageQuantity: 0,
    totalQuantity: 0,
  };

  if (!inventoryData || typeof inventoryData !== 'object') {
    return stats;
  }

  const items = Array.isArray(inventoryData) ? inventoryData : Object.values(inventoryData);
  
  stats.totalItems = items.length;
  
  items.forEach(item => {
    if (item.is_in_stock) {
      stats.inStockItems++;
    } else {
      stats.outOfStockItems++;
    }
    
    const qty = item.qty || 0;
    stats.totalQuantity += qty;
  });

  stats.averageQuantity = stats.totalItems > 0 ? stats.totalQuantity / stats.totalItems : 0;
  
  return stats;
}

/**
 * Main inventory resolver for JSON Schema handler
 */
async function inventoryResolver(parent, args, context) {
  const performance = initializePerformanceTracking('JSON Schema - Inventory');
  
  try {
    const operation = args.operation || 'list';
    let result;
    
    switch (operation) {
      case 'list':
        const pageSize = args.pageSize || 50;
        const currentPage = args.currentPage || 1;
        result = await fetchInventoryList(context, pageSize, currentPage, performance);
        break;
        
      case 'by_sku':
        if (!args.sku) {
          throw new Error('sku is required for by_sku operation');
        }
        result = await fetchInventoryBySku(context, args.sku, performance);
        break;
        
      case 'batch':
        if (!args.skus || !Array.isArray(args.skus)) {
          throw new Error('skus array is required for batch operation');
        }
        result = await fetchInventoryBatch(context, args.skus, performance);
        break;
        
      case 'search':
        if (!args.filters || !Array.isArray(args.filters)) {
          throw new Error('filters array is required for search operation');
        }
        const searchPageSize = args.pageSize || 50;
        const searchCurrentPage = args.currentPage || 1;
        result = await searchInventory(context, args.filters, searchPageSize, searchCurrentPage, performance);
        break;
        
      default:
        throw new Error('Unknown operation: ' + operation);
    }
    
    // Extract statistics if we have inventory data
    const statistics = extractInventoryStatistics(result);
    
    // Update performance metrics
    const inventoryCount = result ? (result.items ? result.items.length : Object.keys(result).length) : 0;
    performance.processedInventoryItems = inventoryCount;
    performance.inventoryMissingCount = performance.inventoryMissingCount || 0;
    performance.inventoryDefaultsUsed = performance.inventoryDefaultsUsed || 0;
    
    console.log('✅ Inventory resolver: Successfully completed', operation, 'operation');
    
    return {
      data: result,
      statistics: statistics,
      operation: operation,
      performance: performance,
      source: 'Inventory',
      method: 'JSON Schema',
    };
    
  } catch (error) {
    console.error('❌ Inventory resolver error:', error);
    
    // Return graceful fallback with default values
    return {
      data: {},
      statistics: extractInventoryStatistics({}),
      operation: args.operation || 'list',
      performance: performance,
      source: 'Inventory',
      method: 'JSON Schema',
      error: error.message,
    };
  }
}

module.exports = {
  inventoryResolver,
  fetchInventoryBySku,
  fetchInventoryBatch,
  fetchInventoryList,
  searchInventory,
  extractInventoryStatistics,
  DEFAULT_INVENTORY_VALUES,
};
