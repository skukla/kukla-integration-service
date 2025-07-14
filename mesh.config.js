const { loadConfig } = require('./config');

// Load configuration to get dynamic values
const config = loadConfig();

module.exports = {
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
              path: `/products?searchCriteria[pageSize]=${config.products.pagination.pageSize}`,
              method: 'GET',
              responseSchema: './samples/json-schema/products-response.json',
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
              responseSchema: './samples/json-schema/categories-response.json',
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
              path: '/inventory/source-items?searchCriteria[pageSize]=200',
              method: 'GET',
              responseSchema: './samples/json-schema/inventory-response.json',
            },
          ],
        },
      },
    },
  ],
};
