#!/usr/bin/env node

/**
 * App Build
 * Complete application build capability with mesh and frontend configuration
 */

const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../config');
const format = require('./shared/formatting');
const { parseArgs, executeScriptWithExit } = require('./shared/script-framework');
const { createSpinner, succeedSpinner } = require('./shared/spinner');

// Business Workflows

/**
 * Complete script build workflow with all components
 * @purpose Execute complete build process including mesh and frontend configuration generation
 * @param {Object} options - Build options
 * @param {boolean} options.configOnly - Generate only frontend config
 * @param {boolean} options.meshOnly - Generate only mesh resolver
 * @param {boolean} options.isProd - Build for production environment
 * @returns {Promise<Object>} Build result with generated components
 * @usedBy build CLI entry point
 */
async function buildAppWithAllComponents(options = {}) {
  const { configOnly = false, meshOnly = false, isProd = false } = options;

  try {
    console.log(format.success('Build started'));
    const results = {};

    // Step 1: Generate frontend configuration (unless mesh-only)
    if (!meshOnly) {
      const configResult = await generateFrontendConfig({ isProd });
      results.frontendConfig = configResult;
      console.log(format.success('Frontend configuration generated'));
    }

    // Step 2: Generate mesh resolver (unless config-only)
    if (!configOnly) {
      const meshSpinner = createSpinner('Building mesh resolver...');
      const meshResult = await generateMeshResolver({ isProd });

      if (!meshResult.success) {
        throw new Error(meshResult.error);
      }

      succeedSpinner(
        meshSpinner,
        `Mesh resolver ${meshResult.generated ? 'regenerated' : 'validated'}`
      );
      results.meshResolver = meshResult;
      console.log(format.success('Mesh configuration generated (mesh.json)'));
      console.log(format.celebration('Mesh built successfully!'));
    }

    // Step 3: Display completion summary
    if (!configOnly && !meshOnly) {
      console.log(format.success('Build completed'));
    }

    return {
      success: true,
      components: results,
      environment: isProd ? 'production' : 'staging',
    };
  } catch (error) {
    console.log(format.error(`Build failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Basic application build workflow
 * @purpose Execute standard build process with mesh and frontend
 * @param {Object} options - Build options
 * @returns {Promise<Object>} Build result
 * @usedBy build workflows requiring standard components
 */
async function buildApp(options = {}) {
  return await buildAppWithAllComponents(options);
}

// Feature Operations

/**
 * Generate frontend configuration files
 * @purpose Create frontend configuration with environment-specific settings
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Frontend generation result
 * @usedBy buildAppWithAllComponents
 */
async function generateFrontendConfig(options = {}) {
  const { isProd = false } = options;

  // Step 1: Ensure output directory exists
  const outputDir = path.join('web-src', 'src', 'config', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 2: Load environment-specific configuration
  const config = loadConfig({}, isProd);
  const env = isProd ? 'production' : 'staging';

  // Step 3: Generate frontend configuration
  const frontendConfig = buildFrontendConfigObject(config, env);
  await writeConfigFile(
    path.join(outputDir, 'config.js'),
    frontendConfig,
    'Frontend config generated'
  );

  // Step 4: Generate URL configuration
  const urlConfig = buildUrlConfigObject(config);
  await writeConfigFile(path.join(outputDir, 'url-config.js'), urlConfig, 'URL config generated');

  return {
    success: true,
    environment: env,
    files: ['config.js', 'url-config.js'],
    outputDir,
  };
}

/**
 * Generate mesh resolver and configuration
 * @purpose Create mesh resolver from templates with environment settings
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Mesh generation result
 * @usedBy buildAppWithAllComponents
 */
async function generateMeshResolver(options = {}) {
  const { isProd = false } = options;

  try {
    // Step 1: Load configuration
    const config = loadConfig({}, isProd);

    // Step 2: Extract mesh configuration
    const meshConfig = extractMeshConfiguration(config);

    // Step 3: Process template and generate resolver
    const resolverResult = await processResolverTemplate(config, meshConfig);

    return {
      success: true,
      generated: resolverResult.regenerated,
      environment: isProd ? 'production' : 'staging',
      meshConfig,
      resolverPath: resolverResult.outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Feature Utilities

/**
 * Build frontend configuration object
 * @purpose Create complete frontend configuration with runtime and performance settings
 * @param {Object} config - Application configuration
 * @param {string} env - Environment name
 * @returns {Object} Frontend configuration object
 * @usedBy generateFrontendConfig
 */
function buildFrontendConfigObject(config, env) {
  return {
    environment: env,
    runtime: {
      package: config.runtime.package,
      version: config.runtime.version,
      url: config.runtime.url,
      paths: config.runtime.paths,
      actions: config.runtime.actions,
    },
    performance: {
      timeout: config.performance.timeouts.api.commerce,
      maxExecutionTime: config.performance.maxExecutionTime,
    },
  };
}

/**
 * Build URL configuration object
 * @purpose Create URL configuration for frontend routing
 * @param {Object} config - Application configuration
 * @returns {Object} URL configuration object
 * @usedBy generateFrontendConfig
 */
function buildUrlConfigObject(config) {
  return {
    actions: config.runtime.actions,
    runtime: {
      url: config.runtime.url,
      namespace: config.runtime.namespace,
    },
  };
}

/**
 * Extract mesh configuration from app config
 * @purpose Extract and validate mesh-specific configuration
 * @param {Object} config - Application configuration
 * @returns {Object} Mesh configuration object
 * @usedBy generateMeshResolver
 */
function extractMeshConfiguration(config) {
  return {
    mesh: config.mesh,
    commerce: {
      baseUrl: config.commerce.baseUrl,
      consumerKey: config.commerce.consumerKey,
    },
    runtime: {
      namespace: config.runtime.namespace,
    },
  };
}

/**
 * Process resolver template with configuration
 * @purpose Generate mesh resolver from template with config substitution
 * @param {Object} config - Application configuration
 * @param {Object} meshConfig - Mesh-specific configuration
 * @returns {Promise<Object>} Template processing result
 * @usedBy generateMeshResolver
 */
async function processResolverTemplate(config, meshConfig) {
  const templatePath = 'mesh-resolvers.template.js';
  const outputPath = 'mesh-resolvers.js';

  // Read template
  const template = await fs.promises.readFile(templatePath, 'utf8');

  // Replace configuration placeholders
  const resolverContent = template
    .replace('{{COMMERCE_BASE_URL}}', meshConfig.commerce.baseUrl)
    .replace('{{COMMERCE_CONSUMER_KEY}}', meshConfig.commerce.consumerKey)
    .replace('{{RUNTIME_NAMESPACE}}', meshConfig.runtime.namespace);

  // Write resolver file
  await fs.promises.writeFile(outputPath, resolverContent);

  // Check if content actually changed
  const regenerated = await checkResolverRegenerated(outputPath, resolverContent);

  return {
    outputPath,
    regenerated,
    templatePath,
  };
}

/**
 * Write configuration file with formatted content
 * @purpose Write configuration object to JavaScript file with proper formatting
 * @param {string} filePath - Output file path
 * @param {Object} configObject - Configuration to write
 * @param {string} successMessage - Success message for logging
 * @returns {Promise<void>} File write completion
 * @usedBy generateFrontendConfig
 */
async function writeConfigFile(filePath, configObject, successMessage) {
  const content = `// Auto-generated configuration file
// Do not edit manually - regenerated during build process

export default ${JSON.stringify(configObject, null, 2)};
`;

  await fs.promises.writeFile(filePath, content);
  console.log(format.success(successMessage));
}

/**
 * Check if resolver was actually regenerated
 * @purpose Compare new content with existing file to detect changes
 * @param {string} outputPath - Path to resolver file
 * @param {string} newContent - New resolver content
 * @returns {Promise<boolean>} Whether file was actually regenerated
 * @usedBy processResolverTemplate
 */
async function checkResolverRegenerated(outputPath, newContent) {
  try {
    const existingContent = await fs.promises.readFile(outputPath, 'utf8');
    return existingContent !== newContent;
  } catch (error) {
    return true; // File didn't exist, so it's definitely regenerated
  }
}

// CLI Entry Point

/**
 * Main CLI function
 * @purpose Handle command line arguments and execute appropriate build workflow
 * @returns {Promise<void>} CLI execution completion
 * @usedBy CLI entry point
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run build:* [options]

Options:
  --help          Show this help message
  --config-only   Generate frontend config only
  --mesh-only     Generate mesh resolver only
  --prod          Build for production environment

Examples:
  npm run build              # Full build (staging)
  npm run build -- --prod    # Full build (production)
  npm run build -- --config-only    # Frontend config only
  npm run build -- --mesh-only      # Mesh resolver only

Note: For deployment, use 'npm run deploy'
    `);
    return;
  }

  const options = {
    configOnly: args['config-only'],
    meshOnly: args['mesh-only'],
    isProd: args.prod,
  };

  if (!options.configOnly && !options.meshOnly) {
    console.log(format.warning('No build target specified. Use --config-only or --mesh-only'));
    console.log('For full deployment, use: npm run deploy');
    return;
  }

  const result = await buildAppWithAllComponents(options);

  if (!result.success) {
    process.exit(1);
  }
}

// CLI Integration
if (require.main === module) {
  executeScriptWithExit('app-build', main);
}

module.exports = {
  buildAppWithAllComponents,
  buildApp,
  generateFrontendConfig,
  generateMeshResolver,
};
