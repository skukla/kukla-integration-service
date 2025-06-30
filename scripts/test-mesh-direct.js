const { loadConfig } = require('../config');
const { extractActionParams } = require('../src/core/http/client');

/**
 * Direct API Mesh Test - Performance Analysis
 * Tests the mesh GraphQL endpoint directly to get detailed performance breakdown
 */
async function testMeshDirectly() {
  try {
    console.log('🔍 DIRECT API MESH PERFORMANCE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Load configuration and extract action params from environment
    const actionParams = extractActionParams({});
    const config = loadConfig(actionParams);

    const meshEndpoint = config.mesh.endpoint;
    const meshApiKey = config.mesh.apiKey;

    if (!meshEndpoint || !meshApiKey) {
      throw new Error('Mesh configuration missing: endpoint or API key not found');
    }

    console.log(`Mesh Endpoint: ${meshEndpoint}`);
    console.log(`Environment: ${config.environment || 'staging'}`);
    console.log('');

    // Generate admin token using action params
    const { getAuthToken } = require('../src/commerce/api/integration');
    const adminToken = await getAuthToken(actionParams);

    // GraphQL query with detailed performance data
    const query = `
      query GetEnrichedProducts($pageSize: Int) {
        mesh_products_enriched(pageSize: $pageSize) {
          products {
            sku
            name
            price
            qty
          }
          total_count
          message
          status
          performance { 
            processedProducts 
            apiCalls 
            method 
            executionTime
            totalTime
            productFetch
            dataExtraction
            parallelFetch
            dataEnrichment
            productsApiCalls
            categoriesApiCalls
            inventoryApiCalls
            totalApiCalls
            uniqueCategories
            productCount
            skuCount
          }
        }
      }
    `;

    const variables = {
      pageSize: config.mesh.pagination.defaultPageSize || 100,
    };

    const requestBody = { query, variables };
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': meshApiKey,
      'x-commerce-admin-token': adminToken,
    };

    console.log('🚀 Executing mesh query...');
    const startTime = Date.now();

    const response = await fetch(meshEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const totalTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Mesh API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    const meshData = result.data?.mesh_products_enriched;
    if (!meshData) {
      throw new Error('No data returned from mesh query');
    }

    console.log('✅ Query completed successfully');
    console.log('');

    // Display results
    console.log('📊 MESH PERFORMANCE BREAKDOWN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status: ${meshData.status}`);
    console.log(`Message: ${meshData.message}`);
    console.log(`Products Processed: ${meshData.total_count}`);
    console.log(`Overall Execution Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log('');

    if (meshData.performance && meshData.performance.totalTime) {
      const perf = meshData.performance;

      console.log('⏱️ STEP-BY-STEP TIMING:');
      console.log(`  Product Fetch:    ${perf.productFetch}`);
      console.log(`  Data Extraction:  ${perf.dataExtraction}`);
      console.log(`  Parallel Fetch:   ${perf.parallelFetch}`);
      console.log(`  Data Enrichment:  ${perf.dataEnrichment}`);
      console.log(`  Total (Internal): ${perf.totalTime}`);
      console.log('');

      console.log('📞 API CALL ANALYSIS:');
      console.log(`  Products:         ${perf.productsApiCalls} calls`);
      console.log(`  Categories:       ${perf.categoriesApiCalls} calls`);
      console.log(`  Inventory:        ${perf.inventoryApiCalls} calls`);
      console.log(`  Total API Calls:  ${perf.totalApiCalls} calls`);
      console.log('');

      console.log('📈 DATA POINTS:');
      console.log(`  Products:         ${perf.productCount}`);
      console.log(`  Unique Categories: ${perf.uniqueCategories}`);
      console.log(`  SKUs:             ${perf.skuCount}`);
      console.log('');

      // Performance analysis
      console.log('🔬 PERFORMANCE ANALYSIS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const productFetchMs = parseInt(perf.productFetch);
      const parallelFetchMs = parseInt(perf.parallelFetch);
      const totalMs = parseInt(perf.totalTime);

      console.log(
        `Product Fetch Time:    ${productFetchMs}ms (${((productFetchMs / totalMs) * 100).toFixed(1)}%)`
      );
      console.log(
        `Parallel Fetch Time:   ${parallelFetchMs}ms (${((parallelFetchMs / totalMs) * 100).toFixed(1)}%)`
      );
      console.log(
        `API Calls per Second:  ${(perf.totalApiCalls / (totalMs / 1000)).toFixed(1)} calls/sec`
      );
      console.log(
        `Categories per Call:   ${(perf.uniqueCategories / perf.categoriesApiCalls).toFixed(1)} avg`
      );
      console.log(
        `Products per Call:     ${(perf.productCount / perf.productsApiCalls).toFixed(1)} avg`
      );

      // Identify bottlenecks
      console.log('');
      console.log('🎯 BOTTLENECK ANALYSIS:');
      const steps = [
        { name: 'Product Fetch', time: productFetchMs },
        { name: 'Parallel Fetch (Categories + Inventory)', time: parallelFetchMs },
      ];

      const slowestStep = steps.reduce((prev, current) =>
        prev.time > current.time ? prev : current
      );

      console.log(`Primary Bottleneck: ${slowestStep.name} (${slowestStep.time}ms)`);

      if (slowestStep.name.includes('Parallel Fetch')) {
        console.log(`  - ${perf.categoriesApiCalls} category API calls`);
        console.log(`  - ${perf.inventoryApiCalls} inventory API calls`);
        console.log('  - Consider bulk category/inventory endpoints');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Direct mesh test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMeshDirectly();
