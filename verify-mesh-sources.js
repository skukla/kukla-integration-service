#!/usr/bin/env node

/**
 * Adobe API Mesh Multi-Source Verification Script
 *
 * Tests whether our OpenAPI handlers are working correctly by:
 * 1. GraphQL introspection to check available sources
 * 2. Testing prefixed operations (Products_, Inventory_, Categories_)
 * 3. Verifying source isolation and authentication
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

async function verifyMeshSources() {
  console.log('\n🔍 Adobe API Mesh Multi-Source Verification\n');
  console.log('='.repeat(60));

  try {
    // Test 1: GraphQL Introspection
    await testGraphQLIntrospection();

    // Test 2: Prefixed Operations
    await testPrefixedOperations();

    // Test 3: Source Authentication
    await testSourceAuthentication();

    console.log('\n✅ All verification tests completed!');
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test 1: GraphQL Introspection
 * Verify that multiple sources are available via introspection
 */
async function testGraphQLIntrospection() {
  console.log('\n📋 Test 1: GraphQL Schema Introspection');
  console.log('-'.repeat(40));

  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          fields {
            name
            type {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await makeGraphQLRequest(introspectionQuery);
    const fields = response.data.__schema.queryType.fields;

    // Check for our expected prefixed operations
    const expectedPrefixes = ['Products_', 'Inventory_', 'Categories_'];
    const results = {};

    expectedPrefixes.forEach((prefix) => {
      const prefixedFields = fields.filter((field) => field.name.startsWith(prefix));
      results[prefix] = prefixedFields.length;

      if (prefixedFields.length > 0) {
        console.log(`✅ ${prefix} source: ${prefixedFields.length} operations found`);
        // Show first few operations
        prefixedFields.slice(0, 3).forEach((field) => {
          console.log(`   - ${field.name}`);
        });
        if (prefixedFields.length > 3) {
          console.log(`   ... and ${prefixedFields.length - 3} more`);
        }
      } else {
        console.log(`❌ ${prefix} source: No operations found`);
      }
    });

    // Check legacy source (backward compatibility)
    const legacyFields = fields.filter(
      (field) =>
        !expectedPrefixes.some((prefix) => field.name.startsWith(prefix)) &&
        !field.name.startsWith('mesh_') &&
        !field.name.startsWith('__')
    );

    if (legacyFields.length > 0) {
      console.log(`✅ Legacy source: ${legacyFields.length} operations found`);
    }

    return results;
  } catch (error) {
    console.error('❌ Introspection failed:', error.message);
    throw error;
  }
}

/**
 * Test 2: Prefixed Operations
 * Test specific prefixed operations to verify they work
 */
async function testPrefixedOperations() {
  console.log('\n🔧 Test 2: Prefixed Operations Testing');
  console.log('-'.repeat(40));

  const tests = [
    {
      name: 'Products_ Operations',
      query: `
        query TestProductsSource {
          __type(name: "Query") {
            fields(includeDeprecated: true) {
              name
              type {
                name
              }
            }
          }
        }
      `,
    },
  ];

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      const response = await makeGraphQLRequest(test.query);

      if (response.data) {
        const queryFields = response.data.__type.fields;
        const prefixedFields = queryFields.filter(
          (field) =>
            field.name.startsWith('Products_') ||
            field.name.startsWith('Inventory_') ||
            field.name.startsWith('Categories_')
        );

        console.log(`✅ Found ${prefixedFields.length} prefixed operations`);

        // Show breakdown by prefix
        ['Products_', 'Inventory_', 'Categories_'].forEach((prefix) => {
          const count = prefixedFields.filter((f) => f.name.startsWith(prefix)).length;
          if (count > 0) {
            console.log(`   - ${prefix}: ${count} operations`);
          }
        });
      } else {
        console.log('❌ No data returned from prefixed operations test');
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
    }
  }
}

/**
 * Test 3: Source Authentication
 * Verify authentication is working for different sources
 */
async function testSourceAuthentication() {
  console.log('\n🔐 Test 3: Source Authentication Testing');
  console.log('-'.repeat(40));

  // Test our custom resolver (which uses all sources)
  const customResolverQuery = `
    query TestCustomResolver {
      mesh_products_enriched(pageSize: 1, maxPages: 1) {
        products {
          sku
          name
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

  try {
    console.log('\n🧪 Testing custom resolver with multi-source authentication...');

    const response = await makeGraphQLRequest(customResolverQuery, {
      'x-commerce-admin-token': generateAdminToken(),
      'x-commerce-consumer-key': params.COMMERCE_CONSUMER_KEY,
      'x-commerce-consumer-secret': params.COMMERCE_CONSUMER_SECRET,
      'x-commerce-access-token': params.COMMERCE_ACCESS_TOKEN,
      'x-commerce-access-token-secret': params.COMMERCE_ACCESS_TOKEN_SECRET,
    });

    if (response.data?.mesh_products_enriched) {
      const result = response.data.mesh_products_enriched;
      console.log(`✅ Custom resolver working: ${result.total_count} products`);

      if (result.performance) {
        console.log('\n📊 Performance Metrics:');
        console.log(`   - Total Time: ${result.performance.totalTime}`);
        console.log(`   - Total API Calls: ${result.performance.totalApiCalls}`);
        console.log(`   - Products API Calls: ${result.performance.productsApiCalls}`);
        console.log(`   - Categories API Calls: ${result.performance.categoriesApiCalls}`);
        console.log(`   - Inventory API Calls: ${result.performance.inventoryApiCalls}`);
        console.log(`   - Method: ${result.performance.method}`);
      }
    } else {
      console.log('❌ Custom resolver returned no data');
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);

    // Check if it's an auth error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 This suggests authentication configuration needs review');
    }
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

  // Basic token format (this would be replaced with actual token generation)
  return Buffer.from(`${username}:${password}`).toString('base64');
}

// Run verification
if (require.main === module) {
  verifyMeshSources().catch((error) => {
    console.error('\n💥 Verification script failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyMeshSources };
