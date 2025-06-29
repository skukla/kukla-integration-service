const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../config');

try {
  // Define paths for the template and the final resolver file
  const templatePath = path.join(__dirname, '..', 'mesh-resolvers.template.js');
  const resolverPath = path.join(__dirname, '..', 'mesh-resolvers.js');

  // Load the template file
  const template = fs.readFileSync(templatePath, 'utf8');

  // Load the full application configuration for the staging environment by default
  const config = loadConfig();

  // Extract mesh configuration properties for injection into resolver
  const meshConfig = {
    pagination: {
      defaultPageSize: config.mesh.pagination.defaultPageSize,
      maxPages: config.mesh.pagination.maxPages,
    },
    batching: {
      categories: config.mesh.batching.categories,
      inventory: config.mesh.batching.inventory,
    },
    timeout: config.mesh.timeout,
    retries: config.mesh.retries,
  };

  // Replace all instances of the placeholder with the stringified config object
  const finalResolver = template.replace(/__MESH_CONFIG__/g, JSON.stringify(meshConfig, null, 2));

  // Write the final content to mesh-resolvers.js
  fs.writeFileSync(resolverPath, finalResolver);

  console.log('✅ Successfully generated mesh-resolvers.js from template');
  console.log(`   - Default page size: ${meshConfig.pagination.defaultPageSize}`);
  console.log(`   - Max pages: ${meshConfig.pagination.maxPages}`);
  console.log(`   - Category batch size: ${meshConfig.batching.categories}`);
  console.log(`   - Inventory batch size: ${meshConfig.batching.inventory}`);
} catch (error) {
  console.error('❌ Error generating mesh-resolvers.js:', error.message);
  process.exit(1);
}
