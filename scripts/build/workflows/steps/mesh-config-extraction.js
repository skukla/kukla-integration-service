/**
 * Mesh Configuration Extraction Step
 * Extracts and processes mesh configuration for deployment
 */

const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../../../../config');

/**
 * Extract mesh configuration for deployment
 * @param {Object} options - Extraction options
 * @param {boolean} options.isProd - Whether extracting for production
 * @returns {Promise<Object>} Extraction result
 */
async function meshConfigExtractionStep(options = {}) {
  const { configPath = 'mesh.json', outputPath = 'dist/mesh.json', isProd = false } = options;

  try {
    // Step 1: Simple environment setup
    const environment = isProd ? 'production' : 'staging';

    // Step 2: Read mesh configuration
    const meshConfigPath = path.resolve(configPath);
    if (!fs.existsSync(meshConfigPath)) {
      throw new Error(`Mesh configuration not found: ${meshConfigPath}`);
    }

    const meshConfig = JSON.parse(fs.readFileSync(meshConfigPath, 'utf8'));

    // Step 3: Load environment configuration
    const config = loadConfig({}, isProd);

    // Step 4: Process configuration for environment
    const processedConfig = {
      ...meshConfig,
      environment,
      timestamp: new Date().toISOString(),
    };

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write processed configuration
    fs.writeFileSync(outputPath, JSON.stringify(processedConfig, null, 2));

    return {
      success: true,
      environment,
      config,
      meshConfig: processedConfig,
      configPath: meshConfigPath,
      outputPath,
      step: `Mesh configuration extracted for ${environment}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  meshConfigExtractionStep,
}; 
