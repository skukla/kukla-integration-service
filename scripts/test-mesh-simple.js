const { loadConfig } = require('../config');

/**
 * Simple Direct Mesh Test - Tests GraphQL query directly
 */
async function testMeshSimple() {
  try {
    console.log('🔍 SIMPLE MESH TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Load configuration for staging environment
    const config = loadConfig({ NODE_ENV: 'staging' });

    const meshEndpoint = config.mesh.endpoint;
    const meshApiKey = config.mesh.apiKey;

    console.log(`Mesh Endpoint: ${meshEndpoint}`);
    console.log(`Environment: ${config.environment || 'staging'}`);
    console.log('');

    // Use a test admin token - for staging we'll use the hardcoded one from config
    // In real usage, this would come from Commerce OAuth, but for testing we can use admin token
    const adminToken = 'test123'; // This will fail auth but let us see the GraphQL response structure

    // Simple GraphQL query to test schema
    const query = `
      query GetEnrichedProducts {
        mesh_products_enriched(pageSize: 10) {
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

    const requestBody = { query };
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': meshApiKey,
      'x-commerce-admin-token': adminToken,
    };

    console.log('🚀 Testing mesh GraphQL schema...');

    const response = await fetch(meshEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`Response Status: ${response.status}`);

    const result = await response.json();

    console.log('📊 MESH RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.errors) {
      console.log('GraphQL Errors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
        if (error.extensions) {
          console.log(`     Code: ${error.extensions.code}`);
        }
      });
    }

    if (result.data) {
      console.log('GraphQL Data:');
      console.log(JSON.stringify(result.data, null, 2));
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Simple mesh test failed:', error.message);
  }
}

// Run the test
testMeshSimple();
