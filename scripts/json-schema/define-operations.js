/**
 * Day 3: Define Core Operations for JSON Schema Sources
 *
 * This script defines and validates the core operations for Products, Categories,
 * and Inventory sources using the JSON Schema handler configuration.
 */

const fs = require('fs/promises');
const path = require('path');

const { loadConfig } = require('../../config');
const { detectEnvironment } = require('../../src/core/environment');
const { extractActionParams } = require('../../src/core/http/client');

/**
 * Load environment parameters from .env file
 * @returns {Object} Environment parameters
 */
async function loadEnvironmentParams() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = await fs.readFile(envPath, 'utf8');
  const params = {};

  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      params[key.trim()] = value.trim();
    }
  });

  return params;
}

/**
 * Define enhanced operations for Products source
 * @param {Object} config - Configuration object
 * @returns {Array} Enhanced products operations
 */
function defineProductsOperations(config) {
  const commerceUrl = config.commerce.baseUrl;

  return [
    {
      type: 'Query',
      field: 'products_list',
      path: '/rest/V1/products',
      method: 'GET',
      description: 'Get paginated list of products',
      requestSample: {
        searchCriteria: {
          pageSize: 20,
          currentPage: 1,
        },
      },
      responseFields: ['items', 'total_count', 'search_criteria'],
      endpoint: `${commerceUrl}/rest/V1/products`,
    },
    {
      type: 'Query',
      field: 'products_search',
      path: '/rest/V1/products',
      method: 'GET',
      description: 'Search products with filters',
      requestSample: {
        searchCriteria: {
          filterGroups: [
            {
              filters: [
                {
                  field: 'status',
                  value: '1',
                  conditionType: 'eq',
                },
              ],
            },
          ],
          pageSize: 20,
          currentPage: 1,
        },
      },
      responseFields: ['items', 'total_count', 'search_criteria'],
      endpoint: `${commerceUrl}/rest/V1/products`,
    },
    {
      type: 'Query',
      field: 'product_by_sku',
      path: '/rest/V1/products/{sku}',
      method: 'GET',
      description: 'Get single product by SKU',
      requestSample: {
        sku: 'sample-product-sku',
      },
      responseFields: ['id', 'sku', 'name', 'price', 'status', 'visibility', 'type_id'],
      endpoint: `${commerceUrl}/rest/V1/products/{sku}`,
    },
  ];
}

/**
 * Define enhanced operations for Categories source
 * @param {Object} config - Configuration object
 * @returns {Array} Enhanced categories operations
 */
function defineCategoriesOperations(config) {
  const commerceUrl = config.commerce.baseUrl;

  return [
    {
      type: 'Query',
      field: 'categories_tree',
      path: '/rest/V1/categories',
      method: 'GET',
      description: 'Get category tree structure',
      requestSample: {
        rootCategoryId: 1,
        depth: 3,
      },
      responseFields: ['id', 'name', 'parent_id', 'is_active', 'position', 'children'],
      endpoint: `${commerceUrl}/rest/V1/categories`,
    },
    {
      type: 'Query',
      field: 'categories_list',
      path: '/rest/V1/categories/list',
      method: 'GET',
      description: 'Get flat list of categories',
      requestSample: {
        searchCriteria: {
          pageSize: 50,
          currentPage: 1,
        },
      },
      responseFields: ['items', 'total_count', 'search_criteria'],
      endpoint: `${commerceUrl}/rest/V1/categories/list`,
    },
    {
      type: 'Query',
      field: 'category_by_id',
      path: '/rest/V1/categories/{id}',
      method: 'GET',
      description: 'Get single category by ID',
      requestSample: {
        id: 1,
      },
      responseFields: ['id', 'name', 'parent_id', 'is_active', 'position', 'product_count'],
      endpoint: `${commerceUrl}/rest/V1/categories/{id}`,
    },
  ];
}

/**
 * Define enhanced operations for Inventory source
 * @param {Object} config - Configuration object
 * @returns {Array} Enhanced inventory operations
 */
function defineInventoryOperations(config) {
  const commerceUrl = config.commerce.baseUrl;

  return [
    {
      type: 'Query',
      field: 'inventory_list',
      path: '/rest/V1/stockItems',
      method: 'GET',
      description: 'Get paginated list of inventory items',
      requestSample: {
        searchCriteria: {
          pageSize: 50,
          currentPage: 1,
        },
      },
      responseFields: ['items', 'total_count', 'search_criteria'],
      endpoint: `${commerceUrl}/rest/V1/stockItems`,
    },
    {
      type: 'Query',
      field: 'inventory_by_sku',
      path: '/rest/V1/stockItems/{sku}',
      method: 'GET',
      description: 'Get inventory for specific SKU',
      requestSample: {
        sku: 'sample-product-sku',
      },
      responseFields: ['item_id', 'product_id', 'stock_id', 'qty', 'is_in_stock', 'is_qty_decimal'],
      endpoint: `${commerceUrl}/rest/V1/stockItems/{sku}`,
    },
    {
      type: 'Query',
      field: 'inventory_search',
      path: '/rest/V1/stockItems',
      method: 'GET',
      description: 'Search inventory with filters',
      requestSample: {
        searchCriteria: {
          filterGroups: [
            {
              filters: [
                {
                  field: 'is_in_stock',
                  value: 'true',
                  conditionType: 'eq',
                },
              ],
            },
          ],
          pageSize: 50,
          currentPage: 1,
        },
      },
      responseFields: ['items', 'total_count', 'search_criteria'],
      endpoint: `${commerceUrl}/rest/V1/stockItems`,
    },
  ];
}

/**
 * Create operation mapping for each source
 * @param {Object} config - Configuration object
 * @returns {Object} Operation mappings
 */
function createOperationMappings(config) {
  return {
    products: {
      source: 'Products',
      operations: defineProductsOperations(config),
      authentication: 'OAuth 1.0',
      primaryKey: 'sku',
      responseType: 'ProductsResponse',
    },
    categories: {
      source: 'Categories',
      operations: defineCategoriesOperations(config),
      authentication: 'OAuth 1.0',
      primaryKey: 'id',
      responseType: 'CategoriesResponse',
    },
    inventory: {
      source: 'Inventory',
      operations: defineInventoryOperations(config),
      authentication: 'Admin Token',
      primaryKey: 'item_id',
      responseType: 'InventoryResponse',
    },
  };
}

/**
 * Generate GraphQL type definitions for operations
 * @param {Object} operationMappings - Operation mappings
 * @returns {String} GraphQL type definitions
 */
function generateGraphQLTypeDefs(operationMappings) {
  const typeDefs = [];

  // Base types
  typeDefs.push(
    'type Product { id: Int sku: String name: String price: Float status: Int visibility: Int type_id: String }'
  );
  typeDefs.push(
    'type Category { id: Int name: String parent_id: Int is_active: Boolean position: Int product_count: Int }'
  );
  typeDefs.push(
    'type InventoryItem { item_id: Int product_id: Int stock_id: Int qty: Float is_in_stock: Boolean is_qty_decimal: Boolean }'
  );

  // Response types
  typeDefs.push(
    'type ProductsResponse { items: [Product] total_count: Int search_criteria: JSON }'
  );
  typeDefs.push(
    'type CategoriesResponse { items: [Category] total_count: Int search_criteria: JSON }'
  );
  typeDefs.push(
    'type InventoryResponse { items: [InventoryItem] total_count: Int search_criteria: JSON }'
  );

  // Query extensions
  const queryExtensions = [];
  Object.values(operationMappings).forEach((mapping) => {
    mapping.operations.forEach((operation) => {
      queryExtensions.push(`${operation.field}: ${mapping.responseType}`);
    });
  });

  typeDefs.push(`extend type Query { ${queryExtensions.join(' ')} }`);

  return typeDefs.join(' ');
}

/**
 * Validate operation definitions
 * @param {Object} operationMappings - Operation mappings
 * @returns {Object} Validation results
 */
function validateOperationDefinitions(operationMappings) {
  const validationResults = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {
      totalOperations: 0,
      sources: 0,
      authMethods: new Set(),
    },
  };

  Object.entries(operationMappings).forEach(([sourceName, mapping]) => {
    validationResults.summary.sources++;
    validationResults.summary.authMethods.add(mapping.authentication);

    // Validate operations
    mapping.operations.forEach((operation) => {
      validationResults.summary.totalOperations++;

      // Required fields validation
      if (!operation.field) {
        validationResults.errors.push(`${sourceName}: Operation missing field name`);
        validationResults.valid = false;
      }

      if (!operation.path) {
        validationResults.errors.push(`${sourceName}: Operation missing path`);
        validationResults.valid = false;
      }

      if (!operation.method) {
        validationResults.errors.push(`${sourceName}: Operation missing method`);
        validationResults.valid = false;
      }

      if (!operation.endpoint) {
        validationResults.errors.push(`${sourceName}: Operation missing endpoint`);
        validationResults.valid = false;
      }

      // Check for proper request samples
      if (!operation.requestSample) {
        validationResults.warnings.push(
          `${sourceName}.${operation.field}: No request sample provided`
        );
      }

      // Check for response fields
      if (!operation.responseFields || operation.responseFields.length === 0) {
        validationResults.warnings.push(
          `${sourceName}.${operation.field}: No response fields defined`
        );
      }
    });
  });

  validationResults.summary.authMethods = Array.from(validationResults.summary.authMethods);

  return validationResults;
}

/**
 * Save operation definitions to files
 * @param {Object} operationMappings - Operation mappings
 * @param {String} graphqlTypeDefs - GraphQL type definitions
 * @param {Object} validation - Validation results
 */
async function saveOperationDefinitions(operationMappings, graphqlTypeDefs, validation) {
  const operationsDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'operations');
  const schemasDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'schemas');

  // Ensure directories exist
  await fs.mkdir(operationsDir, { recursive: true });
  await fs.mkdir(schemasDir, { recursive: true });

  // Save individual operation definitions
  for (const [sourceName, mapping] of Object.entries(operationMappings)) {
    await fs.writeFile(
      path.join(operationsDir, `${sourceName}-operations.json`),
      JSON.stringify(mapping, null, 2)
    );
  }

  // Save combined operation mappings
  await fs.writeFile(
    path.join(operationsDir, 'operation-mappings.json'),
    JSON.stringify(operationMappings, null, 2)
  );

  // Save GraphQL type definitions
  await fs.writeFile(
    path.join(schemasDir, 'graphql-types.json'),
    JSON.stringify({ typeDefs: graphqlTypeDefs }, null, 2)
  );

  // Save validation results
  await fs.writeFile(
    path.join(operationsDir, 'validation-results.json'),
    JSON.stringify(validation, null, 2)
  );

  console.log(`\n✅ Operation definitions saved to ${operationsDir}/`);
  console.log('📁 Files created:');
  console.log('   - products-operations.json (Products source operations)');
  console.log('   - categories-operations.json (Categories source operations)');
  console.log('   - inventory-operations.json (Inventory source operations)');
  console.log('   - operation-mappings.json (Combined mappings)');
  console.log(`   - ${schemasDir}/graphql-types.json (GraphQL type definitions)`);
  console.log('   - validation-results.json (Validation results)');
}

/**
 * Main function for defining operations
 */
async function main() {
  try {
    console.log('📋 Day 3: Starting JSON Schema operation definitions...\n');

    // Load environment and configuration
    const envParams = await loadEnvironmentParams();
    const params = extractActionParams(envParams);
    const config = loadConfig(params);
    const environment = detectEnvironment(params);

    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔗 Commerce URL: ${config.commerce.baseUrl}`);

    // Create operation mappings
    const operationMappings = createOperationMappings(config);

    console.log('\n📊 Operation mappings created:');
    Object.entries(operationMappings).forEach(([sourceName, mapping]) => {
      console.log(
        `   - ${sourceName}: ${mapping.operations.length} operations (${mapping.authentication})`
      );
    });

    // Generate GraphQL type definitions
    const graphqlTypeDefs = generateGraphQLTypeDefs(operationMappings);

    console.log('\n🔧 GraphQL type definitions generated');
    console.log('   - Base types: Product, Category, InventoryItem');
    console.log('   - Response types: ProductsResponse, CategoriesResponse, InventoryResponse');
    console.log(
      `   - Query extensions: ${Object.values(operationMappings).reduce((total, mapping) => total + mapping.operations.length, 0)} operations`
    );

    // Validate operation definitions
    const validation = validateOperationDefinitions(operationMappings);

    console.log('\n✅ Operation validation:');
    console.log(`   - Status: ${validation.valid ? 'VALID' : 'INVALID'}`);
    console.log(`   - Total operations: ${validation.summary.totalOperations}`);
    console.log(`   - Sources: ${validation.summary.sources}`);
    console.log(`   - Auth methods: ${validation.summary.authMethods.join(', ')}`);

    if (validation.errors.length > 0) {
      console.log('\n❌ Validation errors:');
      validation.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Validation warnings:');
      validation.warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    // Save operation definitions
    await saveOperationDefinitions(operationMappings, graphqlTypeDefs, validation);

    console.log('\n🎉 Day 3 completed successfully!');
    console.log('\nNext steps:');
    console.log('   - Day 4: Extract resolver logic from current monolithic resolver');
    console.log('   - Day 5: Create focused product-enrichment.js resolver');
    console.log('   - Day 6: Create category-integration.js resolver');
    console.log('   - Day 7: Create inventory-integration.js resolver');
  } catch (error) {
    console.error('❌ Day 3 failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  defineProductsOperations,
  defineCategoriesOperations,
  defineInventoryOperations,
  createOperationMappings,
  generateGraphQLTypeDefs,
  validateOperationDefinitions,
};
