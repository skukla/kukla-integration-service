/**
 * Frontend Generation Workflow
 * Extracted from scripts/generate-frontend.js for domain organization
 * Handles frontend configuration and asset generation
 */

const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../../../config');
const core = require('../../core');

/**
 * Write generated file with proper formatting
 * @param {string} filePath - Path to write file
 * @param {string} content - File content
 */
async function writeGeneratedFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

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
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load configuration with proper environment detection
    const configSpinner = useSpinners ? core.createSpinner('Loading configuration...') : null;
    const env = core.detectScriptEnvironment({}, { allowCliDetection: true });
    const config = loadConfig({ NODE_ENV: env });
    
    if (configSpinner) {
      configSpinner.succeed(core.formatSpinnerSuccess('Configuration loaded'));
    }

    // Generate frontend configuration
    const frontendSpinner = useSpinners ? core.createSpinner('Generating frontend config...') : null;
    const frontendConfig = {
      environment: env,
      runtime: {
        package: config.runtime.package,
        version: config.runtime.version,
        url: config.runtime.url,
        paths: config.runtime.paths,
        actions: config.runtime.actions,
      },
      performance: {
        timeout: config.commerce.timeout,
        maxExecutionTime: config.performance.maxExecutionTime,
      },
    };

    // Write frontend configuration
    const configContent = `/* eslint-disable */\nexport default ${JSON.stringify(frontendConfig, null, 2)};\n`;
    await writeGeneratedFile(path.join(outputDir, 'config.js'), configContent);
    
    if (frontendSpinner) {
      frontendSpinner.succeed(core.formatSpinnerSuccess('Frontend config generated'));
    }

    // Generate frontend URLs
    const urlSpinner = useSpinners ? core.createSpinner('Generating URL configuration...') : null;
    const urlConfig = {
      actions: config.runtime.actions,
      runtime: {
        url: config.runtime.url,
        namespace: config.runtime.namespace,
      },
    };

    const urlContent = `/* eslint-disable */\nexport default ${JSON.stringify(urlConfig, null, 2)};\n`;
    await writeGeneratedFile(path.join(outputDir, 'urls.js'), urlContent);
    
    if (urlSpinner) {
      urlSpinner.succeed(core.formatSpinnerSuccess('URL configuration generated'));
    }

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
