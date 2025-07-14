/**
 * JSON Schema Multi-Source Authentication Configuration
 *
 * Configures authentication headers for each source following the established
 * functional composition patterns and domain-driven architecture.
 */

const fs = require('fs').promises;
const path = require('path');

const { loadConfig } = require('../../config');
const { detectEnvironment } = require('../../src/core/environment');
const { extractActionParams } = require('../../src/core/http/client');

/**
 * Load environment variables for authentication configuration
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
 * Create OAuth 1.0 operation headers configuration
 * @returns {Object} OAuth headers configuration
 */
function createOAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-commerce-consumer-key': '{context.headers["x-commerce-consumer-key"]}',
    'x-commerce-consumer-secret': '{context.headers["x-commerce-consumer-secret"]}',
    'x-commerce-access-token': '{context.headers["x-commerce-access-token"]}',
    'x-commerce-access-token-secret': '{context.headers["x-commerce-access-token-secret"]}',
  };
}

/**
 * Create admin token operation headers configuration
 * @returns {Object} Admin token headers configuration
 */
function createAdminTokenHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer {context.headers["x-commerce-admin-token"]}',
  };
}

/**
 * Create Products source configuration with OAuth authentication
 * @param {Object} sampleData - Sample data from extraction
 * @param {Object} config - Configuration object
 * @returns {Object} Products source configuration
 */
function createProductsSourceConfig(sampleData, config) {
  const baseUrl = config.commerce.baseUrl;

  return {
    name: 'Products',
    handler: {
      jsonSchema: {
        endpoint: `${baseUrl}/rest/V1/products`,
        operationHeaders: createOAuthHeaders(),
        operations: [
          {
            type: 'Query',
            field: 'products_get',
            path: '/rest/V1/products',
            method: 'GET',
            requestSample: sampleData.products.sampleRequest,
            responseSample: sampleData.products.responseStructure,
          },
        ],
      },
    },
    transforms: [
      {
        prefix: {
          value: 'Products_',
          includeRootOperations: true,
        },
      },
    ],
  };
}

/**
 * Create Categories source configuration with OAuth authentication
 * @param {Object} sampleData - Sample data from extraction
 * @param {Object} config - Configuration object
 * @returns {Object} Categories source configuration
 */
function createCategoriesSourceConfig(sampleData, config) {
  const baseUrl = config.commerce.baseUrl;

  return {
    name: 'Categories',
    handler: {
      jsonSchema: {
        endpoint: `${baseUrl}/rest/V1/categories`,
        operationHeaders: createOAuthHeaders(),
        operations: [
          {
            type: 'Query',
            field: 'categories_get',
            path: '/rest/V1/categories/{id}',
            method: 'GET',
            requestSample: sampleData.categories.sampleRequest,
            responseSample: sampleData.categories.responseStructure,
          },
        ],
      },
    },
    transforms: [
      {
        prefix: {
          value: 'Categories_',
          includeRootOperations: true,
        },
      },
    ],
  };
}

/**
 * Create Inventory source configuration with admin token authentication
 * @param {Object} sampleData - Sample data from extraction
 * @param {Object} config - Configuration object
 * @returns {Object} Inventory source configuration
 */
function createInventorySourceConfig(sampleData, config) {
  const baseUrl = config.commerce.baseUrl;

  return {
    name: 'Inventory',
    handler: {
      jsonSchema: {
        endpoint: `${baseUrl}/rest/all/V1/inventory`,
        operationHeaders: createAdminTokenHeaders(),
        operations: [
          {
            type: 'Query',
            field: 'inventory_get',
            path: '/rest/all/V1/inventory/source-items',
            method: 'GET',
            requestSample: sampleData.inventory.sampleRequest,
            responseSample: sampleData.inventory.responseStructure,
          },
        ],
      },
    },
    transforms: [
      {
        prefix: {
          value: 'Inventory_',
          includeRootOperations: true,
        },
      },
    ],
  };
}

/**
 * Create GraphQL type definitions for multi-source schema
 * @returns {string} GraphQL type definitions
 */
function createGraphQLTypeDefs() {
  return `
    type EnrichedProduct {
      sku: String!
      name: String
      price: Float
      qty: Float
      categories: [ProductCategory]
      images: [ProductImage]
      media_gallery_entries: [MediaGalleryEntry]
      inventory: ProductInventory
    }
    
    type ProductCategory {
      id: String!
      name: String!
    }
    
    type ProductImage {
      filename: String
      url: String
      position: Int
      roles: [String]
    }
    
    type ProductInventory {
      qty: Float
      is_in_stock: Boolean
    }
    
    type MediaGalleryEntry {
      file: String
      url: String
      position: Int
      types: [String]
    }
    
    type ProductsResponse {
      products: [EnrichedProduct]
      total_count: Int
      message: String
      status: String
    }
    
    extend type Query {
      products_enriched(pageSize: Int, maxPages: Int): ProductsResponse
    }
  `.trim();
}

/**
 * Generate complete mesh configuration with authentication
 * @param {Object} sampleData - Sample data from extraction
 * @param {Object} config - Configuration object
 * @returns {Object} Complete mesh configuration
 */
function generateMeshConfig(sampleData, config) {
  const sources = [
    createProductsSourceConfig(sampleData, config),
    createCategoriesSourceConfig(sampleData, config),
    createInventorySourceConfig(sampleData, config),
  ];

  return {
    sources,
    additionalResolvers: ['./json-schema-resolvers.js'],
    additionalTypeDefs: [createGraphQLTypeDefs()],
  };
}

/**
 * Validate authentication configuration
 * @param {Object} params - Action parameters
 * @throws {Error} If authentication configuration is invalid
 */
function validateAuthConfig(params) {
  const requiredOAuthCredentials = [
    'COMMERCE_CONSUMER_KEY',
    'COMMERCE_CONSUMER_SECRET',
    'COMMERCE_ACCESS_TOKEN',
    'COMMERCE_ACCESS_TOKEN_SECRET',
  ];

  const requiredAdminCredentials = ['COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];

  const missingOAuth = requiredOAuthCredentials.filter((cred) => !params[cred]);
  const missingAdmin = requiredAdminCredentials.filter((cred) => !params[cred]);

  if (missingOAuth.length > 0) {
    throw new Error(`Missing OAuth credentials: ${missingOAuth.join(', ')}`);
  }

  if (missingAdmin.length > 0) {
    throw new Error(`Missing admin credentials: ${missingAdmin.join(', ')}`);
  }

  console.log('✅ Authentication configuration validated');
}

/**
 * Save generated configurations to files
 * @param {Object} configs - Generated configurations
 * @param {Object} metadata - Configuration metadata
 */
async function saveConfigurations(configs, metadata) {
  const samplesDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'samples');

  // Ensure directory exists
  await fs.mkdir(samplesDir, { recursive: true });

  // Save authentication summary to samples directory
  await fs.writeFile(
    path.join(samplesDir, 'auth-summary.json'),
    JSON.stringify(
      {
        environment: metadata.environment,
        commerceUrl: metadata.commerceUrl,
        authenticationMethods: {
          products: 'OAuth 1.0',
          categories: 'OAuth 1.0',
          inventory: 'Admin Token',
        },
        sources: configs.meshConfig.sources.map((source) => ({
          name: source.name,
          endpoint: source.handler.jsonSchema.endpoint,
          operations: source.handler.jsonSchema.operations.map((op) => ({
            field: op.field,
            method: op.method,
            path: op.path,
          })),
        })),
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log('\n✅ Authentication configurations saved to proper locations:');
  console.log('📁 Files created:');
  console.log(`   - ${samplesDir}/auth-summary.json (authentication summary and metadata)`);
  console.log('\n📋 Configuration now available through:');
  console.log('   - config.jsonSchema.meshConfig (complete mesh configuration)');
  console.log('   - config.jsonSchema.sources.products (Products source)');
  console.log('   - config.jsonSchema.sources.categories (Categories source)');
  console.log('   - config.jsonSchema.sources.inventory (Inventory source)');
}

/**
 * Main authentication configuration function
 */
async function main() {
  try {
    console.log('🔐 Starting JSON Schema multi-source authentication configuration...\n');

    // Load environment and configuration
    const envParams = await loadEnvironmentParams();
    const params = extractActionParams(envParams);
    const config = loadConfig(params);
    const environment = detectEnvironment(params);

    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔗 Commerce URL: ${config.commerce.baseUrl}`);

    // Validate authentication configuration
    validateAuthConfig(params);

    // Load sample data from Day 1
    const sampleDataPath = path.join(
      process.cwd(),
      'src',
      'mesh',
      'json-schema',
      'samples',
      'raw-api-responses.json'
    );
    const sampleDataContent = await fs.readFile(sampleDataPath, 'utf8');
    const sampleData = JSON.parse(sampleDataContent);

    console.log('\n📊 Sample data loaded:');
    console.log(`   - Products: ${sampleData.products.sampleResponse.items?.length || 0} items`);
    console.log('   - Categories: 1 category sample');
    console.log(`   - Inventory: ${sampleData.inventory.sampleResponse.items?.length || 0} items`);

    // Generate mesh configuration with authentication
    const meshConfig = generateMeshConfig(sampleData, config);

    console.log('\n🔧 Generated configurations:');
    console.log(`   - ${meshConfig.sources.length} authenticated sources`);
    console.log(`   - ${meshConfig.additionalResolvers.length} custom resolvers`);
    console.log('   - GraphQL type definitions included');

    // Save configurations
    await saveConfigurations(
      { meshConfig },
      {
        environment,
        commerceUrl: config.commerce.baseUrl,
        generatedAt: new Date().toISOString(),
      }
    );

    console.log('\n🎉 Authentication configuration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review generated mesh-config.json');
    console.log('2. Create source-specific resolvers');
    console.log('3. Test authentication with each source');
  } catch (error) {
    console.error('\n❌ Authentication configuration failed:', error.message);
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

module.exports = {
  main,
  createOAuthHeaders,
  createAdminTokenHeaders,
  createProductsSourceConfig,
  createCategoriesSourceConfig,
  createInventorySourceConfig,
  generateMeshConfig,
  validateAuthConfig,
};
