/**
 * Main action for exporting Adobe Commerce product data via API Mesh
 * @module get-products-mesh
 */

// Use domain catalogs instead of scattered imports
const processors = require('./lib/processors');
const responses = require('./lib/responses');
const { loadConfig } = require('../../../config');
const { shared } = require('../../../src');

// Import local modules

/**
 * Main action handler for get-products-mesh
 * @param {Object} params - Action parameters from OpenWhisk
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
  const actionParams = shared.extractActionParams(params);

  if (params.__ow_method === 'options') {
    return shared.success({}, 'Preflight success', {});
  }

  try {
    // Initialize configuration
    const config = loadConfig(actionParams);
    const trace = shared.createTraceContext('get-products-mesh', config, actionParams);

    // Execute core processing steps
    const { steps, meshData, builtProducts } = await processors.executeMeshProcessingSteps(
      config,
      actionParams,
      trace
    );

    // Check format parameter to determine response type
    const format = actionParams.format || 'csv';

    if (format === 'json') {
      return responses.createJsonResponse(builtProducts, meshData, steps);
    }

    // Default CSV format
    const processingContext = { config, actionParams, trace, steps };
    const { storageResult } = await processors.executeCsvProcessingSteps(
      builtProducts,
      processingContext
    );

    const exportData = { steps, storageResult, meshData, trace };
    return responses.createCsvExportResponse(exportData);
  } catch (error) {
    return shared.error(error, {});
  }
}

module.exports = {
  main,
};
