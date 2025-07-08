/**
 * Action-specific step functions for get-products-mesh
 * @module get-products-mesh/lib/steps
 */

/**
 * Executes mesh data fetching and processing steps
 * @param {Object} context - Action context
 * @returns {Promise<Object>} Processing results with steps
 */
async function executeMeshDataSteps(context) {
  const { products, core, config, params, trace } = context;
  const steps = [];

  // Step 1: Validate mesh configuration
  await core.traceStep(trace, 'validate-mesh', async () => {
    return await products.validateMeshInput(params, config);
  });
  steps.push(core.formatStepMessage('validate-mesh', 'success'));

  // Step 2: Fetch enriched products from mesh
  const meshData = await core.traceStep(trace, 'fetch-mesh', async () => {
    return await products.fetchEnrichedProductsFromMesh(config, params);
  });
  steps.push(core.formatStepMessage('fetch-mesh', 'success', { count: meshData.total_count }));

  // Sort products by SKU for consistent output
  meshData.products.sort((a, b) => a.sku.localeCompare(b.sku));

  // Step 3: Build product data
  const builtProducts = await core.traceStep(trace, 'build-products', async () => {
    return await products.buildProducts(meshData.products, config);
  });
  steps.push(core.formatStepMessage('build-products', 'success', { count: builtProducts.length }));

  return { steps, meshData, builtProducts };
}

/**
 * Executes CSV processing and storage steps
 * @param {Object} builtProducts - Built product data
 * @param {Object} context - Processing context with accumulated steps
 * @returns {Promise<Object>} Storage results with updated steps
 */
async function executeCsvSteps(builtProducts, context) {
  const { products, files, core, config, params, trace, steps } = context;

  // Step 4: Create CSV
  const csvData = await core.traceStep(trace, 'create-csv', async () => {
    return await products.createCsv(builtProducts, config);
  });
  steps.push(core.formatStepMessage('create-csv', 'success', { size: csvData.stats.originalSize }));

  // Step 5: Store CSV
  const storageResult = await core.traceStep(trace, 'store-csv', async () => {
    return await files.storeCsv(csvData, config, params);
  });
  steps.push(core.formatStepMessage('store-csv', 'success', { info: storageResult }));

  return { storageResult, steps };
}

module.exports = {
  executeMeshDataSteps,
  executeCsvSteps,
};
