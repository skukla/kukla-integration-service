/**
 * Mesh Resolvers - Main Products Resolver
 * GraphQL resolver for enriched products query
 *
 * This file contains the main GraphQL resolver following our domain-driven architecture.
 * Orchestrates all other domain modules to provide the mesh_products_enriched query.
 */

// Import all domain modules
// Note: In actual mesh environment, all code will be embedded during generation
const { extractProductIdentifiers, enrichProductsWithData } = require('./operations');
const { meshConfig } = require('./utils');
const {
  fetchAllProductsFromSource,
  fetchCategoriesFromSource,
  fetchInventoryFromSource,
  calculatePerformanceMetrics,
  initializePerformanceTracking,
} = require('./workflows');

// =============================================================================
// MAIN GRAPHQL RESOLVER
// =============================================================================

/**
 * Main mesh products resolver
 * Follows our action step-based pattern for consistency
 *
 * This resolver orchestrates the entire product enrichment workflow:
 * 1. Fetch products from Commerce API
 * 2. Extract identifiers (category IDs, SKUs)
 * 3. Fetch category and inventory data in parallel
 * 4. Enrich products with consolidated data
 * 5. Calculate performance metrics
 * 6. Return structured response
 */
module.exports = {
  resolvers: {
    Query: {
      mesh_products_enriched: {
        resolve: async (parent, args, context) => {
          try {
            const startTime = Date.now();
            const pageSize = args.pageSize || meshConfig.pagination.defaultPageSize;
            const maxPages = meshConfig.pagination.maxPages;

            // Initialize performance tracking (mirrors our action patterns)
            const performance = initializePerformanceTracking();

            // Store admin credentials from GraphQL arguments (Step 0: Context Setup)
            context.adminCredentials = {
              username: args.adminUsername,
              password: args.adminPassword,
            };

            // STEP 1: Fetch all products (mirrors fetchProducts operation)
            const allProducts = await fetchAllProductsFromSource(
              context,
              pageSize,
              maxPages,
              performance
            );

            // STEP 2: Extract category IDs and SKUs (mirrors our extraction patterns)
            const { categoryIds, skus } = extractProductIdentifiers(allProducts);

            // STEP 3: Fetch category and inventory data in parallel (mirrors enrichment operations)
            const [categoryMap, inventoryMap] = await Promise.all([
              fetchCategoriesFromSource(context, Array.from(categoryIds), performance),
              fetchInventoryFromSource(context, skus, performance),
            ]);

            // STEP 4: Enrich products with consolidated data (mirrors buildProducts pattern)
            const enrichedProducts = enrichProductsWithData(allProducts, categoryMap, inventoryMap);

            // STEP 5: Calculate final performance metrics (mirrors our tracing patterns)
            performance.processedProducts = enrichedProducts.length;
            const finalPerformance = calculatePerformanceMetrics(
              performance,
              categoryIds,
              skus,
              startTime
            );

            // Return structured response (mirrors our response patterns)
            return {
              products: enrichedProducts,
              total_count: enrichedProducts.length,
              message:
                'Successfully fetched ' +
                enrichedProducts.length +
                ' products with category and inventory data',
              status: 'success',
              performance: finalPerformance,
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
