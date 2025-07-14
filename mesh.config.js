const path = require('path');

const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs } = require('@graphql-tools/merge');

// Load and merge all GraphQL schema files using @graphql-tools
const customTypes = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, 'src/mesh/schema/*.graphql'), { recursive: true })
);

module.exports = {
  sources: [
    // Products Source - OAuth 1.0 Authentication
    {
      name: 'commerceProducts',
      handler: {
        openapi: {
          source: 'https://citisignal-com774.adobedemo.com/rest/all/schema?services=all',
          operationHeaders: {
            'Content-Type': 'application/json',
            // OAuth 1.0 signature will be handled by custom resolver for now
          },
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
    },

    // Inventory Source - Admin Token Authentication
    {
      name: 'commerceInventory',
      handler: {
        openapi: {
          source: 'https://citisignal-com774.adobedemo.com/rest/all/schema?services=all',
          operationHeaders: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {context.headers.x-commerce-admin-token}',
          },
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
    },

    // Categories Source - OAuth 1.0 Authentication
    {
      name: 'commerceCategories',
      handler: {
        openapi: {
          source: 'https://citisignal-com774.adobedemo.com/rest/all/schema?services=all',
          operationHeaders: {
            'Content-Type': 'application/json',
            // OAuth 1.0 signature will be handled by custom resolver for now
          },
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
    },

    // Keep original source for backward compatibility during transition
    {
      name: 'commercerest',
      handler: {
        openapi: {
          source: 'https://citisignal-com774.adobedemo.com/rest/all/schema?services=all',
          operationHeaders: {
            'Content-Type': 'application/json',
          },
        },
      },
    },
  ],
  additionalResolvers: [
    './mesh-resolvers.js', // Simplified multi-source resolver
  ],
  additionalTypeDefs: customTypes,
};
