#!/usr/bin/env node

/**
 * Simplified Build Script for Adobe App Builder
 * Essential build functionality without over-engineered abstractions
 */

const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const ora = require('ora');

const { format, parseArgs } = require('./utils/shared');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function generateFrontendConfig() {
  const spinner = ora({
    text: format.muted('Generating frontend configuration'),
    spinner: 'dots',
  }).start();

  // Read the main config with environment variables
  const createConfig = require('../config.js');
  const config = createConfig(process.env);

  // Generate frontend config files
  const configDir = path.join(__dirname, '../web-src/src/config/generated');

  // Ensure directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Generate config.json for frontend
  const frontendConfig = {
    api: {
      baseUrl: config.commerce.baseUrl,
      version: config.commerce.api.version,
    },
    storage: {
      provider: config.storage.provider,
    },
    mesh: {
      endpoint: config.mesh.endpoint,
    },
    performance: {
      timeout: 30000, // 30 seconds default
    },
    runtime: {
      url: '/api/v1/web/kukla-integration-service',
      actions: {
        'auth-token': '/api/v1/web/kukla-integration-service/auth-token',
        'get-products': '/api/v1/web/kukla-integration-service/get-products',
        'get-products-mesh': '/api/v1/web/kukla-integration-service/get-products-mesh',
        'browse-files': '/api/v1/web/kukla-integration-service/browse-files',
        'delete-file': '/api/v1/web/kukla-integration-service/delete-file',
        'download-file': '/api/v1/web/kukla-integration-service/download-file',
      },
    },
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
  };

  fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(frontendConfig, null, 2));

  // Generate config.js for imports
  const configJs = `// Auto-generated frontend configuration
export const config = ${JSON.stringify(frontendConfig, null, 2)};
`;

  fs.writeFileSync(path.join(configDir, 'config.js'), configJs);

  spinner.stop();
  console.log(format.success('Frontend configuration generated'));
}

async function generateMeshResolver() {
  const spinner = ora({
    text: format.muted('Generating mesh resolver'),
    spinner: 'dots',
  }).start();

  const templatePath = path.join(__dirname, '../mesh/templates/resolvers.template.js');
  const outputPath = path.join(__dirname, '../mesh/resolvers.js');

  if (!fs.existsSync(templatePath)) {
    spinner.stop();
    console.log(format.warning('No mesh resolver template found, skipping'));
    return;
  }

  // Read template and replace placeholders with configuration values
  const createConfig = require('../config.js');
  const config = createConfig(process.env);

  let template = fs.readFileSync(templatePath, 'utf8');

  // Load GraphQL queries for inlining (API Mesh doesn't support require())
  const queriesDir = path.join(__dirname, '../mesh/queries');
  const queries = {
    productsList: fs.readFileSync(path.join(queriesDir, 'products-list.gql'), 'utf8').trim(),
    categoriesBatch: fs.readFileSync(path.join(queriesDir, 'categories-batch.gql'), 'utf8').trim(),
    inventoryBatch: fs.readFileSync(path.join(queriesDir, 'inventory-batch.gql'), 'utf8').trim(),
  };

  // Replace configuration placeholders
  template = template.replace(/\{\{\{COMMERCE_BASE_URL\}\}\}/g, config.commerce.baseUrl);
  template = template.replace(
    /\{\{\{CATEGORY_BATCH_THRESHOLD\}\}\}/g,
    config.mesh.categoryBatchThreshold
  );
  template = template.replace(
    /\{\{\{INVENTORY_BATCH_THRESHOLD\}\}\}/g,
    config.mesh.inventoryBatchThreshold
  );
  template = template.replace(
    /\{\{\{MAX_CATEGORIES_DISPLAY\}\}\}/g,
    config.products.maxCategoriesDisplay
  );
  template = template.replace(/\{\{\{MESH_PAGE_SIZE\}\}\}/g, config.mesh.pagination.pageSize);

  // Replace GraphQL query placeholders with inlined queries
  template = template.replace(
    /\{\{\{PRODUCTS_LIST_QUERY\}\}\}/g,
    JSON.stringify(queries.productsList)
  );
  template = template.replace(
    /\{\{\{CATEGORIES_BATCH_QUERY\}\}\}/g,
    JSON.stringify(queries.categoriesBatch)
  );
  template = template.replace(
    /\{\{\{INVENTORY_BATCH_QUERY\}\}\}/g,
    JSON.stringify(queries.inventoryBatch)
  );

  fs.writeFileSync(outputPath, template);

  spinner.stop();
  console.log(format.success('Mesh resolver generated'));
}

async function generateMeshIntegration() {
  const spinner = ora({
    text: format.muted('Generating mesh client module'),
    spinner: 'dots',
  }).start();

  const templatePath = path.join(__dirname, '../mesh/templates/mesh.template.js');
  const outputPath = path.join(__dirname, '../lib/commerce/mesh-client.js');

  if (!fs.existsSync(templatePath)) {
    spinner.stop();
    console.log(format.warning('No mesh integration template found, skipping'));
    return;
  }

  // Load template
  let template = fs.readFileSync(templatePath, 'utf8');

  // Read the main config with environment variables
  const createConfig = require('../config.js');
  const config = createConfig(process.env);

  // Load external GraphQL query for inlining
  const queriesDir = path.join(__dirname, '../mesh/queries');
  let enrichedProductsQuery = fs
    .readFileSync(path.join(queriesDir, 'get-enriched-products.gql'), 'utf8')
    .trim();

  // Replace pagination placeholders in the GraphQL query with config values
  enrichedProductsQuery = enrichedProductsQuery.replace(
    /\{\{\{MESH_PAGE_SIZE\}\}\}/g,
    config.mesh.pagination.pageSize
  );
  enrichedProductsQuery = enrichedProductsQuery.replace(
    /\{\{\{MESH_DEFAULT_PAGE\}\}\}/g,
    config.mesh.pagination.defaultPage
  );

  // Replace query placeholder with inlined query
  template = template.replace(
    /\{\{\{GET_ENRICHED_PRODUCTS_QUERY\}\}\}/g,
    JSON.stringify(enrichedProductsQuery)
  );

  fs.writeFileSync(outputPath, template);

  spinner.stop();
  console.log(format.success('Mesh client module generated'));
}

async function generateMeshConfig() {
  const spinner = ora({
    text: format.muted('Generating mesh configuration'),
    spinner: 'dots',
  }).start();

  try {
    // Load mesh.config.js
    const meshConfigPath = path.join(__dirname, '../mesh/config.js');
    if (!fs.existsSync(meshConfigPath)) {
      spinner.stop();
      console.log(format.warning('No mesh.config.js found, skipping'));
      return;
    }

    // Load and execute mesh.config.js
    const meshConfig = require(meshConfigPath);

    // Generate mesh.json from mesh.config.js
    const meshJson = {
      meshConfig: meshConfig,
    };

    fs.writeFileSync(path.join(__dirname, '../mesh/mesh.json'), JSON.stringify(meshJson, null, 2));

    spinner.stop();
    console.log(format.success('Mesh configuration generated (mesh.json)'));
  } catch (error) {
    spinner.stop();
    console.log(format.error(`Mesh config generation failed: ${error.message}`));
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run build:* [options]

Options:
  --help          Show this help message
  --config-only   Generate frontend config only
  --mesh-only     Generate mesh resolver only

Note: For full deployment, use 'npm run deploy'
    `);
    return;
  }

  console.log(format.deploymentStart('Build started'));
  console.log();
  await format.sleep(500);

  try {
    if (args['config-only']) {
      await generateFrontendConfig();
    } else if (args['mesh-only']) {
      await generateMeshResolver();
      await generateMeshIntegration();
      await generateMeshConfig();
    } else {
      console.log(format.warning('No build target specified. Use --config-only or --mesh-only'));
      console.log('For full deployment, use: npm run deploy');
      return;
    }

    console.log();
    console.log(format.majorSuccess('Build completed successfully'));
  } catch (error) {
    console.error(format.error('Build failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(format.error('Build failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { main };
