const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../config');
const { detectEnvironment } = require('../src/core/environment');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    force: args.includes('--force') || args.includes('-f'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

/**
 * Calculate hash of file content for change detection
 */
function calculateFileHash(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate hash of configuration object for change detection
 */
function calculateConfigHash(config) {
  const configString = JSON.stringify(config, null, 2);
  return crypto.createHash('sha256').update(configString).digest('hex');
}

/**
 * Check if mesh resolver needs regeneration
 */
function needsRegeneration(templatePath, resolverPath, meshConfig, options = {}) {
  // If force flag is used, always regenerate
  if (options.force) {
    return { needed: true, reason: 'Force flag specified' };
  }

  // If resolver doesn't exist, we need to generate it
  if (!fs.existsSync(resolverPath)) {
    return { needed: true, reason: 'Resolver file does not exist' };
  }

  // Calculate current hashes
  const templateHash = calculateFileHash(templatePath);
  const configHash = calculateConfigHash(meshConfig);

  // Try to read existing metadata from resolver file
  const resolverContent = fs.readFileSync(resolverPath, 'utf8');
  const metadataMatch = resolverContent.match(/\/\* GENERATION_METADATA: (.*) \*\//);

  if (!metadataMatch) {
    return { needed: true, reason: 'No generation metadata found in existing resolver' };
  }

  try {
    const existingMetadata = JSON.parse(metadataMatch[1]);

    if (options.verbose) {
      console.log('🔍 Change detection details:');
      console.log(`   Template hash: ${templateHash} (existing: ${existingMetadata.templateHash})`);
      console.log(`   Config hash: ${configHash} (existing: ${existingMetadata.configHash})`);
      console.log(`   Last generated: ${existingMetadata.generatedAt}`);
    }

    // Check if template changed
    if (existingMetadata.templateHash !== templateHash) {
      return { needed: true, reason: 'Template file has changed' };
    }

    // Check if configuration changed
    if (existingMetadata.configHash !== configHash) {
      return { needed: true, reason: 'Mesh configuration has changed' };
    }

    return { needed: false, reason: 'No changes detected' };
  } catch (error) {
    return { needed: true, reason: 'Invalid generation metadata format' };
  }
}

try {
  // Parse command line arguments
  const options = parseArgs();

  // Define paths for the template and the final resolver file
  const templatePath = path.join(__dirname, '..', 'mesh-resolvers.template.js');
  const resolverPath = path.join(__dirname, '..', 'mesh-resolvers.js');

  // Load configuration for the current environment with CLI detection
  const env = detectEnvironment({}, { allowCliDetection: true });
  const config = loadConfig({ NODE_ENV: env });

  // Extract mesh configuration properties for injection into resolver
  const meshConfig = {
    commerceBaseUrl: config.commerce.baseUrl, // Include for hash calculation
    pagination: {
      defaultPageSize: config.mesh.pagination.defaultPageSize,
      maxPages: config.mesh.pagination.maxPages,
    },
    batching: {
      categories: config.mesh.batching.categories,
      inventory: config.mesh.batching.inventory,
      maxConcurrent: config.mesh.batching.maxConcurrent,
      requestDelay: config.mesh.batching.requestDelay,
    },
    timeout: config.mesh.timeout,
    retries: config.mesh.retries,
  };

  // Check if regeneration is needed
  const regenerationCheck = needsRegeneration(templatePath, resolverPath, meshConfig, options);

  if (!regenerationCheck.needed) {
    console.log('✅ Mesh resolver is up to date');
    console.log(`   Reason: ${regenerationCheck.reason}`);
    if (options.verbose) {
      console.log('   Use --force to regenerate anyway');
    }
    process.exit(0);
  }

  console.log('🔄 Generating mesh resolver...');
  console.log(`   Reason: ${regenerationCheck.reason}`);

  // Load the template file
  const template = fs.readFileSync(templatePath, 'utf8');

  // Calculate hashes for metadata
  const templateHash = calculateFileHash(templatePath);
  const configHash = calculateConfigHash(meshConfig);
  const generatedAt = new Date().toISOString();

  // Create generation metadata
  const metadata = {
    templateHash,
    configHash,
    generatedAt,
    version: '1.0.0',
  };

  // Replace all instances of the placeholder with the stringified config object
  let finalResolver = template.replace(/__MESH_CONFIG__/g, JSON.stringify(meshConfig, null, 2));

  // Replace Commerce base URL template variables
  const commerceBaseUrl = config.commerce.baseUrl;
  finalResolver = finalResolver.replace(/\{\{\{COMMERCE_BASE_URL\}\}\}/g, commerceBaseUrl);

  // Remove any existing generation metadata comments
  finalResolver = finalResolver.replace(/\/\* GENERATION_METADATA: .* \*\/\n?/g, '');

  // Add generation metadata as a comment at the top of the file
  const metadataComment = `/* GENERATION_METADATA: ${JSON.stringify(metadata)} */\n`;
  finalResolver = metadataComment + finalResolver;

  // Write the final content to mesh-resolvers.js
  fs.writeFileSync(resolverPath, finalResolver);

  console.log('✅ Successfully generated mesh-resolvers.js from template');
  console.log(`   - Commerce base URL: ${commerceBaseUrl}`);
  console.log(`   - Default page size: ${meshConfig.pagination.defaultPageSize}`);
  console.log(`   - Max pages: ${meshConfig.pagination.maxPages}`);
  console.log(`   - Category batch size: ${meshConfig.batching.categories}`);
  console.log(`   - Inventory batch size: ${meshConfig.batching.inventory}`);
  console.log(`   - Generated at: ${generatedAt}`);
} catch (error) {
  console.error('❌ Error generating mesh-resolvers.js:', error.message);
  process.exit(1);
}
