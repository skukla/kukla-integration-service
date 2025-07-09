/**
 * Frontend Generation Workflow
 * Extracted from scripts/generate-frontend.js for domain organization
 * Handles frontend configuration and asset generation
 */

const path = require('path');

const { configGeneration } = require('../operations');

/**
 * Generate frontend configuration
 * @param {Object} options - Generation options
 * @param {boolean} options.useSpinners - Show spinner progress
 * @returns {Promise<Object>} Generation result
 */
async function generateFrontendConfig(options = {}) {
  const { useSpinners = false } = options;

  try {
    // Create the output directory if it doesn't exist
    const outputDir = path.join('web-src', 'src', 'config', 'generated');
    configGeneration.ensureOutputDirectory(outputDir);

    // Load configuration with proper environment detection
    const { config, env } = await configGeneration.loadConfigWithEnvironment(useSpinners);

    // Generate and write frontend configuration
    const frontendConfig = configGeneration.buildFrontendConfig(config, env);
    await configGeneration.writeConfigFile(
      path.join(outputDir, 'config.js'),
      frontendConfig,
      'Generating frontend config...',
      'Frontend config generated',
      useSpinners
    );

    // Generate and write URL configuration
    const urlConfig = configGeneration.buildUrlConfig(config);
    await configGeneration.writeConfigFile(
      path.join(outputDir, 'urls.js'),
      urlConfig,
      'Generating URL configuration...',
      'URL configuration generated',
      useSpinners
    );

    return {
      success: true,
      environment: env,
      files: [
        path.join(outputDir, 'config.js'),
        path.join(outputDir, 'urls.js'),
      ],
    };

  } catch (error) {
    throw new Error(`Frontend generation failed: ${error.message}`);
  }
}

module.exports = {
  generateFrontendConfig,
}; 
