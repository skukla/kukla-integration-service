const fs = require('fs');
const path = require('path');

const createConfig = require('../config');

// Create configuration with environment defaults for mesh config generation
const config = createConfig({
  COMMERCE_BASE_URL: process.env.COMMERCE_BASE_URL || 'https://citisignal-com774.adobedemo.com',
});

// Load external GraphQL resolver types from consolidated schema file
const typesDir = path.join(__dirname, 'types');
const resolverTypes = fs.readFileSync(path.join(typesDir, 'types.graphql'), 'utf8');

module.exports = {
  // Enhanced response configuration with native mesh caching
  responseConfig: {
    cache: true,
    includeHTTPDetails: true,
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
              path: '/products?searchCriteria[pageSize]={args.pageSize}&searchCriteria[currentPage]={args.currentPage}',
              method: 'GET',
              argTypeMap: {
                pageSize: {
                  type: 'integer',
                },
                currentPage: {
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
