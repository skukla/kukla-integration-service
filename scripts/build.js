#!/usr/bin/env node

/**
 * Simplified Build Script for Adobe App Builder
 * Essential build functionality without over-engineered abstractions
 */

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const dotenv = require('dotenv');
const ora = require('ora');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Formatting functions matching master branch style
const format = {
  success: (message) => chalk.green(`✔ ${message}`),
  majorSuccess: (message) => chalk.green(`✅ ${message}`),
  error: (message) => chalk.red(`✖ ${message}`),
  deploymentAction: (message) => `🔧 ${message}`,
  deploymentStart: (message) => `🚀 ${message}`,
  warning: (message) => chalk.yellow(`⚠ ${message}`),
  muted: (message) => chalk.gray(message),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      parsed[key] = true;
    }
  }
  return parsed;
}

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

  const templatePath = path.join(__dirname, '../mesh-resolvers.template.js');
  const outputPath = path.join(__dirname, '../mesh-resolvers.js');

  if (!fs.existsSync(templatePath)) {
    spinner.stop();
    console.log(format.warning('No mesh resolver template found, skipping'));
    return;
  }

  // Read template and replace placeholders with configuration values
  const createConfig = require('../config.js');
  const config = createConfig(process.env);

  let template = fs.readFileSync(templatePath, 'utf8');

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

  fs.writeFileSync(outputPath, template);

  spinner.stop();
  console.log(format.success('Mesh resolver generated'));
}

async function generateMeshConfig() {
  const spinner = ora({
    text: format.muted('Generating mesh configuration'),
    spinner: 'dots',
  }).start();

  try {
    // Load mesh.config.js
    const meshConfigPath = path.join(__dirname, '../mesh.config.js');
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

    fs.writeFileSync(path.join(__dirname, '../mesh.json'), JSON.stringify(meshJson, null, 2));

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
