const { loadConfig } = require('../config');
const { getAuthToken } = require('../src/commerce/api/integration');
const { extractActionParams } = require('../src/core/http/client');

/**
 * Comprehensive Mesh Performance Analysis
 * Uses proper OAuth authentication to get detailed performance breakdown
 */
async function runMeshAnalysis() {
  try {
    console.log('🔍 COMPREHENSIVE MESH PERFORMANCE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Load configuration and credentials like the real action
    const actionParams = extractActionParams({ NODE_ENV: 'staging' });
    const config = loadConfig(actionParams);

    // Load OAuth credentials from .env like test-action.js does
    const fs = require('fs');
    const path = require('path');
    try {
      const envPath = path.join(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');

        envLines.forEach((line) => {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();

          if (key && value && !actionParams[key]) {
            actionParams[key] = value;
          }
        });
      }
    } catch (error) {
      console.log('Warning: Could not load .env file');
    }

    const meshEndpoint = config.mesh.endpoint;
    const meshApiKey = config.mesh.apiKey;

    console.log(`Mesh Endpoint: ${meshEndpoint}`);
    console.log(`Environment: ${config.environment || 'staging'}`);
    console.log('');

    // Generate real admin token using OAuth like the action
    console.log('🔐 Generating OAuth admin token...');
    const adminToken = await getAuthToken(actionParams);
    console.log('✅ OAuth token generated successfully');
    console.log('');

    // GraphQL query with detailed performance data
    const query = `
      query GetEnrichedProducts($pageSize: Int) {
        mesh_products_enriched(pageSize: $pageSize) {
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

    console.log('🚀 Executing authenticated mesh query...');
    console.log(`   Page Size: ${variables.pageSize}`);
    const startTime = Date.now();

    const response = await fetch(meshEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const totalTime = Date.now() - startTime;

    console.log(`   Response Status: ${response.status}`);
    console.log(`   Overall Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log('');

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.log('❌ GraphQL Errors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
      });
      return;
    }

    const meshData = result.data?.mesh_products_enriched;
    if (!meshData) {
      console.log('❌ No data returned from mesh query');
      return;
    }

    if (meshData.status === 'error') {
      console.log(`❌ Mesh Error: ${meshData.message}`);
      return;
    }

    // Display comprehensive results
    console.log('📊 DETAILED MESH PERFORMANCE BREAKDOWN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status: ${meshData.status}`);
    console.log(`Message: ${meshData.message}`);
    console.log(`Products Processed: ${meshData.total_count}`);
    console.log(`Overall Execution Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log('');

    if (meshData.performance && meshData.performance.totalTime) {
      const perf = meshData.performance;

      console.log('⏱️ STEP-BY-STEP TIMING:');
      console.log(`  Product Fetch:    ${perf.productFetch || 'N/A'}`);
      console.log(`  Data Extraction:  ${perf.dataExtraction || 'N/A'}`);
      console.log(`  Parallel Fetch:   ${perf.parallelFetch || 'N/A'}`);
      console.log(`  Data Enrichment:  ${perf.dataEnrichment || 'N/A'}`);
      console.log(`  Total (Internal): ${perf.totalTime || 'N/A'}`);
      console.log('');

      console.log('📞 API CALL ANALYSIS:');
      console.log(`  Products:         ${perf.productsApiCalls || 0} calls`);
      console.log(`  Categories:       ${perf.categoriesApiCalls || 0} calls`);
      console.log(`  Inventory:        ${perf.inventoryApiCalls || 0} calls`);
      console.log(`  Total API Calls:  ${perf.totalApiCalls || 0} calls`);
      console.log('');

      console.log('📈 DATA POINTS:');
      console.log(`  Products:         ${perf.productCount || 0}`);
      console.log(`  Unique Categories: ${perf.uniqueCategories || 0}`);
      console.log(`  SKUs:             ${perf.skuCount || 0}`);
      console.log('');

      // Performance analysis with detailed breakdown
      if (perf.productFetch && perf.parallelFetch && perf.totalTime) {
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
          `Categories per Call:   ${(perf.uniqueCategories / (perf.categoriesApiCalls || 1)).toFixed(1)} avg`
        );
        console.log(
          `Products per Call:     ${(perf.productCount / (perf.productsApiCalls || 1)).toFixed(1)} avg`
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
          console.log('  - Optimization: Implement bulk category/inventory endpoints');
        }

        // Recommendations
        console.log('');
        console.log('💡 OPTIMIZATION RECOMMENDATIONS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (perf.categoriesApiCalls > 20) {
          console.log('🔥 HIGH IMPACT: Bulk Category Endpoint');
          console.log(`   Current: ${perf.categoriesApiCalls} individual /categories/{id} calls`);
          console.log('   Solution: Single bulk categories call');
          console.log('   Expected: 30-40% performance improvement');
        }

        if (perf.inventoryApiCalls > 50) {
          console.log('🔥 HIGH IMPACT: Bulk Inventory Endpoint');
          console.log(`   Current: ${perf.inventoryApiCalls} individual inventory calls`);
          console.log('   Solution: Batch inventory search criteria');
          console.log('   Expected: 20-30% performance improvement');
        }

        console.log('🚀 MEDIUM IMPACT: In-Memory Category Caching');
        console.log('   Solution: Cache categories during resolver execution');
        console.log('   Expected: 10-15% performance improvement');
      }
    } else {
      console.log('⚠️ Detailed performance data not available');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Mesh analysis failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the analysis
runMeshAnalysis();
