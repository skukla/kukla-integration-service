const path = require('path');

const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs } = require('@graphql-tools/merge');

// Load and merge all GraphQL schema files using @graphql-tools
const customTypes = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, 'src/mesh/schema/*.graphql'), { recursive: true })
);

module.exports = {
  sources: [
    {
      name: 'commercerest',
      handler: {
        openapi: {
          source: 'https://citisignal-com774.adobedemo.com/rest/all/schema?services=all',
          operationHeaders: {
            'Content-Type': 'application/json',
            Authorization: "Bearer {context.headers['x-commerce-admin-token']}",
          },
        },
      },
    },
  ],
  additionalResolvers: [
    './mesh-resolvers.js', // Single template-generated resolver file
  ],
  additionalTypeDefs: customTypes,
};
