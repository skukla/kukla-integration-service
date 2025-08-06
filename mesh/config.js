const fs = require('fs');
const path = require('path');

const createConfig = require('../config');

// Create configuration with environment defaults for mesh config generation
const config = createConfig({
  COMMERCE_BASE_URL: process.env.COMMERCE_BASE_URL || 'https://citisignal-com774.adobedemo.com',
});

// Load external GraphQL resolver types from multiple files
const typesDir = path.join(__dirname, 'types');
const productTypes = fs.readFileSync(path.join(typesDir, 'products.graphql'), 'utf8');
const responseTypes = fs.readFileSync(path.join(typesDir, 'responses.graphql'), 'utf8');
const performanceTypes = fs.readFileSync(path.join(typesDir, 'performance.graphql'), 'utf8');
const queryTypes = fs.readFileSync(path.join(typesDir, 'queries.graphql'), 'utf8');

// Combine all type definitions
const resolverTypes = [productTypes, responseTypes, performanceTypes, queryTypes].join('\n\n');

module.exports = {
  // Enhanced response configuration with native mesh caching
  responseConfig: {
    cache: true, // Enable native mesh caching - 62% performance improvement
    includeHTTPDetails: true, // Include HTTP response details for debugging and monitoring
  },
  sources: [
    {
      name: 'Products',
      handler: {
        JsonSchema: {
          baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
          operationHeaders: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
          },
          operations: [
            {
              type: 'Query',
              field: 'products_list',
              path: '/products?searchCriteria[pageSize]={args.pageSize}',
              method: 'GET',
              argTypeMap: {
                pageSize: {
                  type: 'integer',
                },
              },
              responseSchema: './schema/products-response.json',
            },
          ],
        },
      },
    },
    {
      name: 'Categories',
      handler: {
        JsonSchema: {
          baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
          operationHeaders: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
          },
          operations: [
            {
              type: 'Query',
              field: 'categories_batch',
              path: '/categories/list?searchCriteria[pageSize]=20&searchCriteria[filter_groups][0][filters][0][field]=entity_id&searchCriteria[filter_groups][0][filters][0][value]={args.categoryIds}&searchCriteria[filter_groups][0][filters][0][condition_type]=in',
              method: 'GET',
              argTypeMap: {
                categoryIds: {
                  type: 'string',
                },
              },
              responseSchema: './schema/category-batch-resp.json',
            },
          ],
        },
      },
    },
    {
      name: 'Inventory',
      handler: {
        JsonSchema: {
          baseUrl: `${config.commerce.baseUrl}/rest/all/V1`,
          operationHeaders: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
          },
          operations: [
            {
              type: 'Query',
              field: 'inventory_batch',
              path: '/inventory/source-items?searchCriteria[pageSize]=50&searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]={args.skus}&searchCriteria[filter_groups][0][filters][0][condition_type]=in',
              method: 'GET',
              argTypeMap: {
                skus: {
                  type: 'string',
                },
              },
              responseSchema: './schema/inventory-batch-resp.json',
            },
          ],
        },
      },
    },
  ],
  // External GraphQL resolver types for custom resolvers
  additionalTypeDefs: resolverTypes,
  additionalResolvers: ['./resolvers.js'],
};
