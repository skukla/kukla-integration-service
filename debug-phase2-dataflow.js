#!/usr/bin/env node

/**
 * Phase 2 Data Flow Debugging Script
 *
 * Focuses on debugging the 0 products issue while preserving
 * our confirmed working multi-source architecture.
 */

const { loadConfig } = require('./config');

// Load configuration
const params = {
  COMMERCE_CONSUMER_KEY: process.env.COMMERCE_CONSUMER_KEY,
  COMMERCE_CONSUMER_SECRET: process.env.COMMERCE_CONSUMER_SECRET,
  COMMERCE_ACCESS_TOKEN: process.env.COMMERCE_ACCESS_TOKEN,
  COMMERCE_ACCESS_TOKEN_SECRET: process.env.COMMERCE_ACCESS_TOKEN_SECRET,
  COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
  COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
};

const appConfig = loadConfig(params);

async function debugDataFlow() {
  console.log('\n🔍 Phase 2 Data Flow Debugging\n');
  console.log('='.repeat(60));
  console.log('🎯 Goal: Restore 119 products while keeping architecture gains');
  console.log('✅ Known: Multi-source architecture working (90 operations)');
  console.log('❌ Issue: 0 products returned instead of 119');
  console.log('');

  try {
    // Step 1: Verify architecture still working
    console.log('📋 Step 1: Architecture Health Check');
    console.log('-'.repeat(40));
    await verifyArchitectureHealth();

    // Step 2: Test current data flow
    console.log('\n📊 Step 2: Data Flow Analysis');
    console.log('-'.repeat(40));
    await analyzeDataFlow();

    // Step 3: Compare with baseline
    console.log('\n📈 Step 3: Baseline Comparison');
    console.log('-'.repeat(40));
    await compareWithBaseline();

    // Step 4: Authentication flow check
    console.log('\n🔐 Step 4: Authentication Flow Check');
    console.log('-'.repeat(40));
    await checkAuthenticationFlow();

    console.log('\n' + '='.repeat(60));
    console.log('🎯 Debug Summary and Next Steps');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Debug script failed:', error.message);
    process.exit(1);
  }
}

/**
 * Step 1: Verify our architecture is still working
 */
async function verifyArchitectureHealth() {
  console.log('🔍 Checking multi-source architecture...');

  try {
    const introspectionQuery = `
      query ArchitectureCheck {
        __schema {
          queryType {
            fields {
              name
            }
          }
        }
      }
    `;

    const response = await makeGraphQLRequest(introspectionQuery);
    const fields = response.data.__schema.queryType.fields;

    // Count prefixed operations
    const prefixCounts = {
      Products_: fields.filter((f) => f.name.startsWith('Products_')).length,
      Inventory_: fields.filter((f) => f.name.startsWith('Inventory_')).length,
      Categories_: fields.filter((f) => f.name.startsWith('Categories_')).length,
    };

    const totalPrefixed = Object.values(prefixCounts).reduce((a, b) => a + b, 0);

    if (totalPrefixed >= 90) {
      console.log(`✅ Architecture healthy: ${totalPrefixed} prefixed operations`);
      Object.entries(prefixCounts).forEach(([prefix, count]) => {
        console.log(`   - ${prefix}: ${count} operations`);
      });
    } else {
      console.log(`❌ Architecture degraded: Only ${totalPrefixed} prefixed operations`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Architecture check failed:', error.message);
    return false;
  }
}

/**
 * Step 2: Analyze current data flow
 */
async function analyzeDataFlow() {
  console.log('🔍 Testing custom resolver data flow...');

  const dataFlowQuery = buildDataFlowQuery();

  try {
    const response = await makeGraphQLRequest(dataFlowQuery, {
      'x-commerce-admin-token': generateAdminToken(),
      'x-commerce-consumer-key': params.COMMERCE_CONSUMER_KEY,
      'x-commerce-consumer-secret': params.COMMERCE_CONSUMER_SECRET,
      'x-commerce-access-token': params.COMMERCE_ACCESS_TOKEN,
      'x-commerce-access-token-secret': params.COMMERCE_ACCESS_TOKEN_SECRET,
    });

    if (response.data?.mesh_products_enriched) {
      analyzeDataFlowResults(response.data.mesh_products_enriched);
    } else {
      console.log('❌ No data returned from custom resolver');
    }
  } catch (error) {
    console.error('❌ Data flow test failed:', error.message);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('💡 Authentication issue detected');
    }
  }
}

/**
 * Build the GraphQL query for data flow testing
 */
function buildDataFlowQuery() {
  return `
    query DataFlowTest {
      mesh_products_enriched(pageSize: 3, maxPages: 1) {
        products {
          sku
          name
          price
        }
        total_count
        performance {
          totalTime
          totalApiCalls
          productsApiCalls
          categoriesApiCalls
          inventoryApiCalls
          method
        }
      }
    }
  `;
}

/**
 * Analyze the results from data flow test
 */
function analyzeDataFlowResults(result) {
  console.log(`📊 Results: ${result.total_count || 0} products returned`);
  console.log(`📦 Products array length: ${result.products?.length || 0}`);

  if (result.products && result.products.length > 0) {
    console.log('✅ Sample product data:');
    result.products.slice(0, 2).forEach((product, i) => {
      console.log(`   ${i + 1}. SKU: ${product.sku}, Name: ${product.name}`);
    });
  } else {
    console.log('❌ No products in array - THIS IS THE PROBLEM');
  }

  if (result.performance) {
    console.log('\n📈 Performance Metrics:');
    console.log(`   - Method: ${result.performance.method}`);
    console.log(`   - Total Time: ${result.performance.totalTime}`);
    console.log(`   - Total API Calls: ${result.performance.totalApiCalls}`);
    console.log(`   - Products API Calls: ${result.performance.productsApiCalls}`);
    console.log(`   - Categories API Calls: ${result.performance.categoriesApiCalls}`);
    console.log(`   - Inventory API Calls: ${result.performance.inventoryApiCalls}`);
  } else {
    console.log('❌ No performance metrics - suggests resolver issue');
  }
}

/**
 * Step 3: Compare with known working baseline
 */
async function compareWithBaseline() {
  console.log('🔍 Comparing with Phase 1 baseline (119 products)...');

  // This would typically call the working get-products action
  console.log('📋 Expected baseline results:');
  console.log('   - Products: 119');
  console.log('   - File size: ~24 KB');
  console.log('   - Categories: Multiple');
  console.log('   - Inventory data: Present');

  console.log('\n📋 Current Phase 2 results:');
  console.log('   - Products: 0 ❌');
  console.log('   - File size: ~1 KB ❌');
  console.log('   - Performance metrics: null ❌');

  console.log('\n🎯 Gap analysis:');
  console.log('   - Architecture: Working ✅');
  console.log('   - Schema: Working ✅');
  console.log('   - Authentication: Needs verification ❓');
  console.log('   - Data fetching: Broken ❌');
}

/**
 * Step 4: Check authentication flow
 */
async function checkAuthenticationFlow() {
  console.log('🔍 Checking authentication flow to sources...');

  // Check if credentials are properly formatted
  const authChecks = {
    'OAuth Consumer Key': !!params.COMMERCE_CONSUMER_KEY,
    'OAuth Consumer Secret': !!params.COMMERCE_CONSUMER_SECRET,
    'OAuth Access Token': !!params.COMMERCE_ACCESS_TOKEN,
    'OAuth Access Token Secret': !!params.COMMERCE_ACCESS_TOKEN_SECRET,
    'Admin Username': !!params.COMMERCE_ADMIN_USERNAME,
    'Admin Password': !!params.COMMERCE_ADMIN_PASSWORD,
  };

  console.log('📋 Credential availability:');
  Object.entries(authChecks).forEach(([name, available]) => {
    console.log(`   - ${name}: ${available ? '✅' : '❌'}`);
  });

  const allCredsAvailable = Object.values(authChecks).every(Boolean);

  if (allCredsAvailable) {
    console.log('\n✅ All credentials available');
    console.log('💡 Issue likely in credential passing to sources');
  } else {
    console.log('\n❌ Missing credentials detected');
    console.log('💡 Check .env file and app.config.yaml configuration');
  }
}

/**
 * Make GraphQL request to mesh endpoint
 */
async function makeGraphQLRequest(query, customHeaders = {}) {
  const fetch = (await import('node-fetch')).default;

  const meshEndpoint = appConfig.mesh.endpoint;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': appConfig.mesh.apiKey,
    ...customHeaders,
  };

  const response = await fetch(meshEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL Error: ${result.errors.map((e) => e.message).join(', ')}`);
  }

  return result;
}

/**
 * Generate admin token for authentication
 */
function generateAdminToken() {
  const username = params.COMMERCE_ADMIN_USERNAME;
  const password = params.COMMERCE_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('Commerce admin credentials not found');
  }

  return Buffer.from(`${username}:${password}`).toString('base64');
}

// Run debugging
if (require.main === module) {
  debugDataFlow().catch((error) => {
    console.error('\n💥 Debug script failed:', error);
    process.exit(1);
  });
}

module.exports = { debugDataFlow };
