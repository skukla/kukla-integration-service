const fs = require('fs');
const path = require('path');

const createConfig = require('../config');

// Create configuration with environment defaults for mesh config generation
const config = createConfig({
  COMMERCE_BASE_URL: process.env.COMMERCE_BASE_URL || 'https://citisignal-com774.adobedemo.com',
});

// Load external GraphQL schema file
const enrichedProductsSchema = fs.readFileSync(
  path.join(__dirname, 'schema/enriched-products.graphql'),
  'utf8'
);

module.exports = {
  // Enhanced response configuration with native mesh features
  responseConfig: {
    cache: true,
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
              responseSchema: './mesh/schema/products-response.json',
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
              field: 'category_info',
              path: '/categories/{args.categoryId}',
              method: 'GET',
              argTypeMap: {
                categoryId: {
                  type: 'integer',
                },
              },
              responseSchema: './mesh/schema/cat-response.json',
            },
            // Add batch category endpoint for better performance
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
              responseSchema: './mesh/schema/cat-batch-response.json',
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
              field: 'inventory_items',
              path: '/inventory/source-items?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]={args.sku}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq',
              method: 'GET',
              argTypeMap: {
                sku: {
                  type: 'string',
                },
              },
              responseSchema: './mesh/schema/stock-item-response.json',
            },
            // Add batch inventory endpoint for better performance
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
              responseSchema: './mesh/schema/inv-batch-resp.json',
            },
          ],
        },
      },
    },
  ],
  // External GraphQL schema file for custom resolver types
  additionalTypeDefs: enrichedProductsSchema,
  additionalResolvers: ['./mesh/resolvers.js'],
};
