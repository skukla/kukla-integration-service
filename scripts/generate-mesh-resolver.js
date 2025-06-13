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
  const config = loadConfig({ NODE_ENV: 'staging' });

  // Extract only the necessary properties for the mesh resolver
  const meshConfig = {
    commerce: {
      baseUrl: config.commerce.baseUrl,
      paths: {
        products: config.commerce.paths.products,
      },
    },
    mesh: {
      timeout: config.mesh.timeout,
      retries: config.mesh.retries,
    },
  };

  // Replace the placeholder in the template with the stringified config object
  const finalResolver = template.replace('__MESH_CONFIG__', JSON.stringify(meshConfig, null, 2));

  // Write the final content to mesh-resolvers.js
  fs.writeFileSync(resolverPath, finalResolver);

  console.log('✅ Successfully generated mesh-resolvers.js from template');
} catch (error) {
  console.error('❌ Error generating mesh-resolvers.js:', error.message);
  process.exit(1);
}
