const { loadConfig } = require('./config');

/**
 * Test the deployed mesh with corrected schema structure
 * This script uses the actual schema structure discovered from introspection
 */

async function testMeshCorrected() {
  console.log('🎯 Testing Mesh with Corrected Schema Structure');
  console.log('='.repeat(55));

  try {
    // Load configuration
    const params = {
      COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
    };

    const config = loadConfig(params);
    const meshEndpoint = config.mesh.endpoint;
    const meshApiKey = config.mesh.apiKey;

    console.log('📋 Configuration:');
    console.log(`   Mesh Endpoint: ${meshEndpoint}`);
    console.log('');

    // Generate admin token
    console.log('🔑 Step 1: Generate Admin Token');
    const tokenUrl = `${config.commerce.baseUrl}/rest/V1/integration/admin/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: params.COMMERCE_ADMIN_USERNAME,
        password: params.COMMERCE_ADMIN_PASSWORD,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(
        `Token generation failed: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const adminToken = await tokenResponse.json();
    console.log(`   ✅ Admin token generated (${adminToken.length} characters)`);
    console.log('');

    // Test 1: Products with corrected structure
    console.log('📦 Step 2: Test Products with Corrected Structure');
    const productsQuery = `
      query {
        products_list {
          items {
            id
            sku
            name
            price
            status
            type_id
            created_at
            updated_at
          }
          total_count
        }
      }
    `;

    const productsResult = await queryMesh(meshEndpoint, meshApiKey, adminToken, productsQuery);

    if (productsResult.data?.products_list) {
      const products = productsResult.data.products_list;
      console.log('   ✅ Products query successful');
      console.log(
        `   📊 Retrieved ${products.items?.length || 0} products (${products.total_count} total)`
      );
      if (products.items && products.items.length > 0) {
        console.log(
          `   🔍 Sample product: ${products.items[0].name || 'N/A'} (${products.items[0].sku || 'N/A'})`
        );
      }
    } else {
      console.log('   ❌ Products query failed');
      console.log('   🔍 Response:', JSON.stringify(productsResult, null, 2));
    }
    console.log('');

    // Test 2: Category Info (already working)
    console.log('📁 Step 3: Test Category Info');
    const categoryQuery = `
      query {
        category_info(categoryId: 2) {
          id
          name
          is_active
          level
          parent_id
          position
          path
          include_in_menu
        }
      }
    `;

    const categoryResult = await queryMesh(meshEndpoint, meshApiKey, adminToken, categoryQuery);

    if (categoryResult.data?.category_info) {
      const category = categoryResult.data.category_info;
      console.log('   ✅ Category query successful');
      console.log(`   📂 Category: ${category.name} (ID: ${category.id})`);
      console.log(`   📊 Level: ${category.level}, Active: ${category.is_active}`);
    } else {
      console.log('   ❌ Category query failed');
      console.log('   🔍 Response:', JSON.stringify(categoryResult, null, 2));
    }
    console.log('');

    // Test 3: Inventory with discovered fields
    console.log('📊 Step 4: Test Inventory with Discovered Fields');
    const inventoryQuery = `
      query {
        inventory_items {
          item_id
          sku
          qty
          is_in_stock
          stock_id
          min_qty
          max_sale_qty
          backorders
          is_qty_decimal
        }
      }
    `;

    const inventoryResult = await queryMesh(meshEndpoint, meshApiKey, adminToken, inventoryQuery);

    if (inventoryResult.data?.inventory_items) {
      const inventory = inventoryResult.data.inventory_items;
      console.log('   ✅ Inventory query successful');
      console.log(`   📊 Inventory data structure: ${typeof inventory}`);
      console.log(`   🔍 Sample data: ${JSON.stringify(inventory).slice(0, 200)}...`);
    } else {
      console.log('   ❌ Inventory query failed');
      console.log('   🔍 Response:', JSON.stringify(inventoryResult, null, 2));
    }
    console.log('');

    // Test 4: Introspect products items structure
    console.log('🔍 Step 5: Introspect Products Items Type');
    const itemsIntrospection = `
      query {
        __type(name: "query_products_list_items") {
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    `;

    const itemsResult = await queryMesh(meshEndpoint, meshApiKey, adminToken, itemsIntrospection);

    if (itemsResult.data?.__type?.fields) {
      const fields = itemsResult.data.__type.fields;
      console.log(`   ✅ Products items type has ${fields.length} fields:`);
      fields.slice(0, 10).forEach((field) => {
        console.log(`   📋 ${field.name}: ${field.type.name || field.type.kind}`);
      });
      if (fields.length > 10) {
        console.log(`   📋 ... and ${fields.length - 10} more fields`);
      }
    } else {
      console.log('   ❌ Products items introspection failed');
      console.log('   🔍 Response:', JSON.stringify(itemsResult, null, 2));
    }
    console.log('');

    // Final Summary
    console.log('🎯 Test Summary:');
    console.log(
      `   Products Source: ${productsResult.data?.products_list ? '✅ Working' : '❌ Failed'}`
    );
    console.log(
      `   Categories Source: ${categoryResult.data?.category_info ? '✅ Working' : '❌ Failed'}`
    );
    console.log(
      `   Inventory Source: ${inventoryResult.data?.inventory_items ? '✅ Working' : '❌ Failed'}`
    );
    console.log('');

    const allWorking =
      productsResult.data?.products_list &&
      categoryResult.data?.category_info &&
      inventoryResult.data?.inventory_items;

    if (allWorking) {
      console.log('✨ All JsonSchema sources are working correctly!');
      console.log('🎉 Multi-source mesh deployment successful!');
    } else {
      console.log('⚠️  Some sources may need schema adjustments');
      console.log('🔧 Check the JSON schema files for proper structure');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

/**
 * Query the mesh endpoint with GraphQL
 */
async function queryMesh(endpoint, apiKey, adminToken, query) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-commerce-admin-token': adminToken,
    },
    body: JSON.stringify({
      query: query.trim(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Mesh query failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Run the test
testMeshCorrected();
