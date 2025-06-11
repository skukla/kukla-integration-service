/**
 * Generate frontend assets from backend configuration and logic
 * Consolidates config and URL generation for simpler build process
 */

const fs = require('fs');
const path = require('path');

const { loadConfig } = require('../config');
const { detectEnvironment } = require('../src/core/environment');

/**
 * Generate frontend configuration
 */
function generateFrontendConfig() {
  // Detect environment with CLI detection enabled
  const environment = detectEnvironment({}, { allowCliDetection: true });
  console.log(`✨ Detected environment: ${environment}`);

  // Load backend configuration with detected environment
  const config = loadConfig({ NODE_ENV: environment });

  // Create frontend-safe configuration
  const frontendConfig = {
    environment: config.environment,
    runtime: {
      package: config.runtime.package,
      version: config.runtime.version,
      url: process.env[`RUNTIME_URL_${config.environment.toUpperCase()}`],
      paths: config.runtime.paths,
      actions: config.runtime.actions,
    },
    performance: {
      timeout: config.performance.timeout,
      maxExecutionTime: config.performance.maxExecutionTime,
    },
  };

  // Generate the configuration module
  const configContent = `/**
 * GENERATED FILE - DO NOT EDIT
 * Frontend configuration generated from backend configuration
 */

export default ${JSON.stringify(frontendConfig, null, 2)};
`;

  // Ensure directory exists
  const configDir = path.resolve(__dirname, '../web-src/src/config/generated');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Write generated configuration
  fs.writeFileSync(path.resolve(configDir, 'config.js'), configContent);
}

/**
 * Generate frontend URL module
 */
function generateFrontendUrl() {
  // Read the backend URL building logic
  const backendUrlPath = path.resolve(__dirname, '../src/core/url/index.js');
  const backendUrlCode = fs.readFileSync(backendUrlPath, 'utf8');

  // Extract the buildActionUrl function from backend code
  const buildActionUrlMatch = backendUrlCode.match(/function buildActionUrl\([\s\S]*?\n\}/);

  if (!buildActionUrlMatch) {
    throw new Error('Could not find buildActionUrl function in backend code');
  }

  let buildActionUrlCode = buildActionUrlMatch[0];

  // Convert CommonJS-style function to ES6 module format
  buildActionUrlCode = buildActionUrlCode.replace(
    'function buildActionUrl(',
    'export function buildActionUrl('
  );

  // Generate the complete frontend URL module
  const frontendUrlContent = `/**
 * GENERATED FILE - DO NOT EDIT
 * Frontend URL building logic generated from backend implementation
 * This ensures consistent URL handling between backend and frontend
 */

import { getRuntimeConfig } from '../config/index.js';

${buildActionUrlCode}

/**
 * Get the URL for an action with parameters
 * @param {string} action - The action name
 * @param {Object} [params] - URL parameters
 * @returns {string} The action URL
 * @throws {Error} If the action is unknown
 */
export function getActionUrl(action, params = {}) {
  const runtimeConfig = getRuntimeConfig();

  // Check if action exists in configuration
  if (!runtimeConfig.actions || !runtimeConfig.actions[action]) {
    throw new Error(\`Unknown action: \${action}\`);
  }

  // Determine if we should use relative URLs
  const useRelative = !runtimeConfig.url || runtimeConfig.url === '';

  return buildActionUrl(runtimeConfig, action, {
    absolute: !useRelative,
    params,
  });
}

/**
 * Get the download URL for a file
 * @param {string} fileName - The name of the file
 * @param {string} [path] - Optional path to the file
 * @returns {string} The download URL
 */
export function getDownloadUrl(fileName, path) {
  return getActionUrl('download-file', {
    fileName,
    path,
  });
}

/**
 * Get the delete URL for a file
 * @param {string} fileName - The name of the file
 * @param {string} [path] - Optional path to the file
 * @returns {string} The delete URL
 */
export function getDeleteUrl(fileName, path) {
  return getActionUrl('delete-file', {
    fileName,
    path,
  });
}

/**
 * Build download URL for files with proper encoding
 * @param {string} filePath - File path to download
 * @returns {string} Download URL
 */
export function buildDownloadUrl(filePath) {
  return getActionUrl('download-file', {
    filePath: encodeURIComponent(filePath),
  });
}

/**
 * Get configuration for debugging
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return getRuntimeConfig();
}`;

  // Ensure directory exists
  const frontendUrlDir = path.resolve(__dirname, '../web-src/src/js/core/url');
  if (!fs.existsSync(frontendUrlDir)) {
    fs.mkdirSync(frontendUrlDir, { recursive: true });
  }

  // Write generated frontend URL module
  fs.writeFileSync(path.resolve(frontendUrlDir, 'index.js'), frontendUrlContent);
}

// Generate both configuration and URL modules
generateFrontendConfig();
generateFrontendUrl();

console.log('✅ Generated frontend configuration and URL modules');
