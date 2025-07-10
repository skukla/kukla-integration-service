/**
 * Mesh Configuration Extraction Step
 * Extracts and processes mesh configuration for deployment
 */

const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../../../../config');
const { detectScriptEnvironment } = require('../../../core/operations/environment');

/**
 * Extract mesh configuration for deployment
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result
 */
async function meshConfigExtractionStep(options = {}) {
  const { configPath = 'mesh.json', outputPath = 'dist/mesh.json' } = options;

  try {
    // Detect environment
    const environment = detectScriptEnvironment();

    // Read mesh configuration
    const meshConfigPath = path.resolve(configPath);
    if (!fs.existsSync(meshConfigPath)) {
      throw new Error(`Mesh configuration not found: ${meshConfigPath}`);
    }

    const meshConfig = JSON.parse(fs.readFileSync(meshConfigPath, 'utf8'));

    // Load environment configuration
    const config = loadConfig();

    // Process configuration for environment
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
