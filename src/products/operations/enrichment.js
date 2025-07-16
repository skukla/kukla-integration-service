/**
 * Products Enrichment Operations
 *
 * Main orchestration for product data enrichment.
 * Coordinates the complete product enrichment pipeline by combining
 * product fetching, category enrichment, and inventory enrichment.
 */

const { enrichWithCategories } = require('./category-enrichment');
const { enrichWithInventory } = require('./inventory-enrichment');
const { fetchProducts } = require('./product-fetching');

/**
 * Create performance tracker for REST API operations
 * @param {number} startTime - Operation start time
 * @returns {Object} Performance tracker object
 */
function createPerformanceTracker(startTime) {
  return {
    startTime,
    method: 'REST API',
    apiCalls: 0,
    productsApiCalls: 0,
    categoriesApiCalls: 0,
    inventoryApiCalls: 0,
    clientCalls: 0,
    dataSourcesUnified: 3, // Products, Categories, Inventory
    processedProducts: 0,
    uniqueCategories: 0,

    // Method to increment API call counters
    incrementApiCall: function (type) {
      this.apiCalls++;
      this.clientCalls++;
      if (type === 'products') {
        this.productsApiCalls++;
      } else if (type === 'categories') {
        this.categoriesApiCalls++;
      } else if (type === 'inventory') {
        this.inventoryApiCalls++;
      }
    },

    // Method to finalize performance metrics
    finalize: function (productCount, categoryCount) {
      this.processedProducts = productCount;
      this.uniqueCategories = categoryCount;
      this.totalApiCalls = this.apiCalls;
      this.executionTime = Date.now() - this.startTime;
      this.totalTime = this.executionTime;
      return this;
    },
  };
}

/**
 * Fetch and enrich products with all data (categories and inventory)
 *
 * This is the main composition function that orchestrates the complete product
 * data enrichment pipeline. It combines multiple data sources to create a
 * comprehensive product dataset suitable for CSV export or frontend display.
 *
 * Data Pipeline:
 * 1. Fetch base product data from Commerce API (paginated)
 * 2. Extract category IDs from products and custom_attributes
 * 3. Batch fetch category details with concurrency control
 * 4. Enrich products with category names and hierarchy
 * 5. Extract SKUs for inventory lookup
 * 6. Batch fetch inventory data with concurrency control
 * 7. Enrich products with stock quantities and availability
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL and performance settings
 * @param {Object} [trace] - Optional trace context for API call tracking and performance monitoring
 * @returns {Promise<Array|Object>} Array of fully enriched product objects, or object with products and performance data when trace includes performanceTracker
 * @throws {Error} If Commerce URL is missing, authentication fails, or critical API errors occur
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  // Check if we should track performance
  const shouldTrackPerformance = trace && trace.performanceTracker;
  let performanceTracker;

  if (shouldTrackPerformance) {
    performanceTracker = trace.performanceTracker;
  } else if (trace === 'create-performance-tracker') {
    // Special case: create performance tracker for REST API
    const startTime = Date.now();
    performanceTracker = createPerformanceTracker(startTime);
    trace = { performanceTracker };
  }

  try {
    const products = await fetchProducts(params, config, trace);

    // Enrich with categories first, then inventory
    const categorizedProducts = await enrichWithCategories(products, config, params, trace);
    const fullyEnrichedProducts = await enrichWithInventory(
      categorizedProducts,
      config,
      params,
      trace
    );

    // If performance tracking is enabled, return detailed metrics
    if (performanceTracker) {
      // Extract unique category count for metrics
      const uniqueCategories = new Set();
      fullyEnrichedProducts.forEach((product) => {
        if (product.categories) {
          product.categories.forEach((cat) => uniqueCategories.add(cat.id || cat.name));
        }
      });

      // Finalize performance metrics
      const performance = performanceTracker.finalize(
        fullyEnrichedProducts.length,
        uniqueCategories.size
      );

      return {
        products: fullyEnrichedProducts,
        performance,
      };
    }

    // Default behavior: return just the products array
    return fullyEnrichedProducts;
  } catch (error) {
    throw new Error(`Product fetch and enrichment failed: ${error.message}`);
  }
}

// Re-export specialized functions for backward compatibility
module.exports = {
  // Import and re-export from specialized files
  ...require('./product-fetching'),
  ...require('./category-enrichment'),
  ...require('./inventory-enrichment'),

  // Main orchestration function
  fetchAndEnrichProducts,
};
