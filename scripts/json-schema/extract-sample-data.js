/**
 * Sample Data Extraction Script for JSON Schema Multi-Source Configuration
 *
 * This script extracts actual API responses from Commerce APIs to generate
 * JSON Schema configurations for the multi-source mesh approach.
 */

const fs = require('fs').promises;
const path = require('path');

const { loadConfig } = require('../../config');
const { makeCommerceRequest } = require('../../src/commerce').api.integration;
const { extractActionParams } = require('../../src/core/http/client');

/**
 * Load environment variables from .env file
 */
async function loadEnvironmentParams() {
  const envPath = path.join(process.cwd(), '.env');
  try {
    const envContent = await fs.readFile(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    throw new Error(`Failed to load .env file: ${error.message}`);
  }
}

/**
 * Extract sample products data
 */
async function extractProductsSample(params, config) {
  console.log('🔍 Extracting products sample...');

  // Get a small sample of products
  const response = await makeCommerceRequest(
    '/products?searchCriteria[pageSize]=3',
    {
      method: 'GET',
    },
    config,
    params
  );

  // Extract response body from HTTP response
  const data = response.body || response;

  console.log('DEBUG: Products API response:', {
    statusCode: response.statusCode,
    hasBody: !!response.body,
    hasItems: !!data.items,
    itemsLength: data.items ? data.items.length : 0,
    totalCount: data.total_count,
    dataKeys: Object.keys(data),
    sampleItem: data.items && data.items[0] ? Object.keys(data.items[0]) : null,
  });

  if (!data.items || data.items.length === 0) {
    throw new Error(
      `No products found in API response. Status: ${response.statusCode}, Data keys: ${Object.keys(data).join(', ')}`
    );
  }

  return {
    endpoint: '/rest/V1/products',
    method: 'GET',
    sampleRequest: {
      searchCriteria: {
        pageSize: 3,
        currentPage: 1,
      },
    },
    sampleResponse: data,
    responseStructure: {
      items: data.items.slice(0, 1), // Single product example
      total_count: data.total_count,
      search_criteria: data.search_criteria,
    },
    authMethod: 'oauth1',
    requiredHeaders: ['Authorization: OAuth oauth_consumer_key="...", oauth_token="...", ...'],
  };
}

/**
 * Extract sample categories data
 */
async function extractCategoriesSample(params, config) {
  console.log('🔍 Extracting categories sample...');

  // Get a few different categories (common IDs that usually exist)
  const categoryIds = [2, 3, 4]; // Default category, root categories
  const samples = [];

  for (const categoryId of categoryIds) {
    try {
      const response = await makeCommerceRequest(
        `/categories/${categoryId}`,
        {
          method: 'GET',
        },
        config,
        params
      );

      // Extract response body from HTTP response
      const categoryData = response.body || response;
      samples.push(categoryData);
      break; // Use first successful response
    } catch (error) {
      console.log(`Category ${categoryId} not found, trying next...`);
    }
  }

  if (samples.length === 0) {
    throw new Error('No categories found in API responses');
  }

  return {
    endpoint: '/rest/V1/categories/{id}',
    method: 'GET',
    sampleRequest: {
      pathParams: { id: 'category_id' },
    },
    sampleResponse: samples[0],
    responseStructure: samples[0],
    authMethod: 'oauth1',
    requiredHeaders: ['Authorization: OAuth oauth_consumer_key="...", oauth_token="...", ...'],
  };
}

/**
 * Extract sample inventory data
 */
async function extractInventorySample(params, config) {
  console.log('🔍 Extracting inventory sample...');

  // Get inventory for a few SKUs
  const searchCriteria = {
    filterGroups: [
      {
        filters: [
          {
            field: 'sku',
            value: 'WS12,WS03,WJ12', // Common test SKUs
            conditionType: 'in',
          },
        ],
      },
    ],
    pageSize: 5,
  };

  const queryString = `searchCriteria=${encodeURIComponent(JSON.stringify(searchCriteria))}`;
  const response = await makeCommerceRequest(
    `/inventory/source-items?${queryString}`,
    {
      method: 'GET',
    },
    config,
    params
  ); // Different base path for inventory

  // Extract response body from HTTP response
  const inventoryData = response.body || response;

  return {
    endpoint: '/rest/all/V1/inventory/source-items',
    method: 'GET',
    sampleRequest: {
      searchCriteria: searchCriteria,
    },
    sampleResponse: inventoryData,
    responseStructure: {
      items: inventoryData.items ? inventoryData.items.slice(0, 1) : [], // Single inventory item example
      total_count: inventoryData.total_count,
      search_criteria: inventoryData.search_criteria,
    },
    authMethod: 'admin_token',
    requiredHeaders: ['Authorization: Bearer {admin_token}'],
  };
}

/**
 * Generate JSON Schema from sample data
 */
function generateJsonSchema(sampleData, schemaName) {
  console.log(`📝 Generating JSON Schema for ${schemaName}...`);

  return {
    name: schemaName,
    handler: {
      jsonSchema: {
        endpoint: sampleData.endpoint,
        operations: [
          {
            type: sampleData.method,
            field: `${schemaName.toLowerCase()}_${sampleData.method.toLowerCase()}`,
            path: sampleData.endpoint,
            method: sampleData.method,
            requestSample: sampleData.sampleRequest,
            responseSample: sampleData.responseStructure,
          },
        ],
      },
    },
    authentication: {
      method: sampleData.authMethod,
      headers: sampleData.requiredHeaders,
    },
    sampleData: sampleData,
  };
}

/**
 * Save sample data and schemas to files
 */
async function saveSampleData(extractedData) {
  const samplesDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'samples');
  const schemasDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'schemas');
  const operationsDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'operations');

  // Ensure directories exist
  await fs.mkdir(samplesDir, { recursive: true });
  await fs.mkdir(schemasDir, { recursive: true });
  await fs.mkdir(operationsDir, { recursive: true });

  // Save raw sample data
  await fs.writeFile(
    path.join(samplesDir, 'raw-api-responses.json'),
    JSON.stringify(extractedData.rawSamples, null, 2)
  );

  // Save individual schemas
  for (const schema of extractedData.schemas) {
    await fs.writeFile(
      path.join(schemasDir, `${schema.name.toLowerCase()}.json`),
      JSON.stringify(schema, null, 2)
    );
  }

  // Save operations separately
  for (const schema of extractedData.schemas) {
    await fs.writeFile(
      path.join(operationsDir, `${schema.name.toLowerCase()}-operations.json`),
      JSON.stringify(schema.handler.jsonSchema.operations, null, 2)
    );
  }

  console.log('\n✅ Sample data saved to proper locations:');
  console.log('📁 Files created:');
  console.log(`   - ${samplesDir}/raw-api-responses.json (actual API responses)`);
  console.log(`   - ${schemasDir}/*.json (individual source schemas)`);
  console.log(`   - ${operationsDir}/*-operations.json (individual source operations)`);
}

/**
 * Main extraction function
 */
async function main() {
  try {
    console.log(
      '🚀 Starting sample data extraction for JSON Schema multi-source configuration...\n'
    );

    // Load configuration and parameters
    const envParams = await loadEnvironmentParams();
    const params = extractActionParams(envParams);
    const config = loadConfig(params);

    console.log(`🔗 Commerce URL: ${config.commerce.baseUrl}`);
    console.log(
      `🔑 Using OAuth credentials: ${params.COMMERCE_CONSUMER_KEY ? 'Present' : 'Missing'}\n`
    );

    // Extract sample data from each API
    const rawSamples = {
      products: await extractProductsSample(params, config),
      categories: await extractCategoriesSample(params, config),
      inventory: await extractInventorySample(params, config),
    };

    console.log('\n📊 Sample data extraction completed:');
    console.log(`   - Products: ${rawSamples.products.sampleResponse.items?.length || 0} items`);
    console.log('   - Categories: 1 category sample');
    console.log(`   - Inventory: ${rawSamples.inventory.sampleResponse.items?.length || 0} items`);

    // Generate JSON Schema configurations
    const schemas = [
      generateJsonSchema(rawSamples.products, 'Products'),
      generateJsonSchema(rawSamples.categories, 'Categories'),
      generateJsonSchema(rawSamples.inventory, 'Inventory'),
    ];

    // Save all data
    await saveSampleData({ rawSamples, schemas });

    console.log('\n🎉 Sample data extraction completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review generated schemas in scripts/json-schema/samples/');
    console.log('2. Configure authentication for each source');
    console.log('3. Create source-specific resolvers');
  } catch (error) {
    console.error('\n❌ Sample data extraction failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, extractProductsSample, extractCategoriesSample, extractInventorySample };
