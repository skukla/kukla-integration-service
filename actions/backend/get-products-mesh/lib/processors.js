/**
 * Processing functions for API Mesh operations
 * @module lib/processors
 */

// Import domain catalogs

// Import local modules
const meshApi = require('./mesh-api');
const validation = require('./validation');
const { products, files, shared } = require('../../../../src');

/**
 * Fetches enriched products from API Mesh
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @returns {Promise<Object>} Full mesh response object
 */
async function fetchEnrichedProductsFromMesh(config, actionParams) {
  const { meshEndpoint, meshApiKey } = validation.validateMeshConfiguration(config);
  const oauthCredentials = validation.extractOAuthCredentials(actionParams);
  const adminCredentials = validation.validateAdminCredentials(actionParams);

  const credentials = {
    oauth: oauthCredentials,
    admin: adminCredentials,
    meshApiKey,
  };

  const { requestBody, headers } = meshApi.createMeshRequestConfig(config, credentials);

  const requestConfig = { endpoint: meshEndpoint, requestBody, headers };
  const result = await meshApi.makeMeshRequestWithRetry(requestConfig, {
    retries: config.mesh.retries || 3,
    retryDelay: 1000,
    timeout: config.mesh.timeout || 30000,
  });

  return validation.validateMeshResponse(result);
}

/**
 * Executes the core mesh data processing steps
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} trace - Trace context
 * @returns {Promise<Object>} Processing results
 */
async function executeMeshProcessingSteps(config, actionParams, trace) {
  const steps = [];

  // Step 1: Validate mesh configuration using products domain
  await shared.traceStep(trace, 'validate-mesh', async () => {
    return await products.validateMeshInput(actionParams, config);
  });
  steps.push(shared.formatStepMessage('validate-mesh', 'success'));

  // Step 2: Fetch enriched products from mesh
  const meshData = await shared.traceStep(trace, 'fetch-mesh', async () => {
    return await fetchEnrichedProductsFromMesh(config, actionParams);
  });
  steps.push(shared.formatStepMessage('fetch-mesh', 'success', { count: meshData.total_count }));

  // Sort products by SKU for consistent output
  meshData.products.sort((a, b) => a.sku.localeCompare(b.sku));

  // Step 3: Build product data using products domain
  const builtProducts = await shared.traceStep(trace, 'build-products', async () => {
    return await products.buildProducts(meshData.products, config);
  });
  steps.push(
    shared.formatStepMessage('build-products', 'success', { count: builtProducts.length })
  );

  return { steps, meshData, builtProducts };
}

/**
 * Executes CSV processing steps
 * @param {Object} builtProducts - Built product data
 * @param {Object} processingContext - Processing context
 * @param {Object} processingContext.config - Configuration object
 * @param {Object} processingContext.actionParams - Action parameters
 * @param {Object} processingContext.trace - Trace context
 * @param {Array} processingContext.steps - Processing steps array
 * @returns {Promise<Object>} CSV processing results
 */
async function executeCsvProcessingSteps(builtProducts, processingContext) {
  const { config, actionParams, trace, steps } = processingContext;

  // Step 4: Create CSV using products domain
  const csvData = await shared.traceStep(trace, 'create-csv', async () => {
    return await products.createCsv(builtProducts, config);
  });
  steps.push(
    shared.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize })
  );

  // Step 5: Store CSV using files domain
  const storageResult = await shared.traceStep(trace, 'store-csv', async () => {
    return await files.storeCsv(csvData, config, actionParams);
  });
  steps.push(shared.formatStepMessage('store-csv', 'success', { info: storageResult }));

  return { storageResult };
}

module.exports = {
  fetchEnrichedProductsFromMesh,
  executeMeshProcessingSteps,
  executeCsvProcessingSteps,
};
