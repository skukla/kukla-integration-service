/**
 * Commerce Integration Workflows
 *
 * High-level orchestration functions for complete Commerce API integration workflows.
 * Pure orchestration following DDD patterns - delegates to operations layer.
 */

const {
  orchestrateProductRequests,
  orchestrateProductEnrichment,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const { orchestrateDataProcessing } = require('../operations/data-processing');
const {
  buildCommerceIntegrationSuccessResponse,
  buildCommerceIntegrationErrorResponse,
  buildProductListingSuccessResponse,
  buildProductListingErrorResponse,
  buildHealthCheckSuccessResponse,
  buildHealthCheckErrorResponse,
  buildExportSuccessResponse,
  buildExportErrorResponse,
} = require('../operations/response-building');
const {
  validateCommerceIntegrationParams,
  validateProductListingParams,
  validateHealthCheckParams,
  createValidationErrorResponse,
} = require('../operations/validation');

/**
 * Executes a complete Commerce API integration workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} params - Workflow parameters
 * @param {Object} params.query - Query parameters for API requests
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters including admin credentials
 * @param {Object} [params.trace] - Optional trace context
 * @param {Object} [params.options] - Processing options
 * @returns {Promise<Object>} Complete integration result
 */
async function executeCommerceIntegration(params) {
  const { query, config, actionParams, trace, options = {} } = params;

  try {
    // Step 1: Validate parameters
    const validationError = validateCommerceIntegrationParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'commerce-integration');
    }

    // Step 2: Execute product enrichment with retry handling
    const enrichmentResult = await retryWithAuthHandling(
      () => orchestrateProductEnrichment(query, config, actionParams, trace),
      { maxRetries: 2, retryDelay: 1000 }
    );

    // Step 3: Process the enriched data
    const processingResult = orchestrateDataProcessing(enrichmentResult, config, options);

    // Step 4: Build success response
    return buildCommerceIntegrationSuccessResponse(processingResult);
  } catch (error) {
    // Step 5: Build error response
    return buildCommerceIntegrationErrorResponse(error, {
      workflow: 'commerce-integration',
      query: JSON.stringify(query),
    });
  }
}

/**
 * Executes a product listing workflow
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} params - Workflow parameters
 * @param {Object} params.listingParams - Product listing parameters
 * @param {number} [params.listingParams.pageSize] - Products per page
 * @param {number} [params.listingParams.currentPage] - Current page number
 * @param {string} [params.listingParams.searchTerm] - Search term
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Product listing result
 */
async function executeProductListing(params) {
  const { listingParams, config, actionParams, trace } = params;

  try {
    // Step 1: Validate parameters
    const validationError = validateProductListingParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'product-listing');
    }

    // Step 2: Execute product request without full enrichment for listing
    const productResult = await orchestrateProductRequests(
      listingParams,
      config,
      actionParams,
      trace
    );

    // Step 3: Process basic product data
    const processingOptions = {
      validate: false, // Skip validation for listing performance
      includeInventory: false, // Skip inventory for listing performance
      includeCategories: true, // Include categories for filtering
    };

    const processed = orchestrateDataProcessing(
      { products: productResult.items || [] },
      config,
      processingOptions
    );

    // Step 4: Build listing result
    const listingResult = {
      products: processed.products,
      pagination: {
        currentPage: listingParams.currentPage || 1,
        pageSize: listingParams.pageSize || 20,
        totalCount: productResult.total_count || 0,
        totalPages: Math.ceil((productResult.total_count || 0) / (listingParams.pageSize || 20)),
      },
      resultCount: processed.products.length,
    };

    // Step 5: Build success response
    return buildProductListingSuccessResponse(listingResult);
  } catch (error) {
    // Step 6: Build error response
    return buildProductListingErrorResponse(error, {
      listingParams: JSON.stringify(listingParams),
    });
  }
}

/**
 * Executes a product export workflow
 * @param {Object} params - Workflow parameters
 * @param {Object} params.exportParams - Export parameters
 * @param {Array<string>} [params.exportParams.fields] - Fields to export
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Product export result
 */
async function executeProductExport(params) {
  const { exportParams, config, actionParams, trace } = params;

  try {
    // Step 1: Execute complete integration for export
    const integrationResult = await executeCommerceIntegration({
      query: exportParams,
      config,
      actionParams,
      trace,
      options: {
        fields: exportParams.fields,
        validate: true,
        includeCategories: true,
        includeInventory: true,
      },
    });

    if (!integrationResult.success) {
      return integrationResult;
    }

    // Step 2: Build export result
    const exportResult = {
      exportData: integrationResult.data.products,
      exportMetadata: {
        ...integrationResult.metadata,
        exportFields: exportParams.fields || 'all',
        workflow: 'product-export',
      },
    };

    // Step 3: Build success response
    return buildExportSuccessResponse(exportResult);
  } catch (error) {
    // Step 4: Build error response
    return buildExportErrorResponse(error, {
      stage: 'product-export',
      dataType: 'product',
      exportParams: JSON.stringify(exportParams),
    });
  }
}

/**
 * Executes a health check workflow for Commerce API
 * Pure orchestration workflow that delegates to operations layer.
 *
 * @param {Object} params - Workflow parameters
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @returns {Promise<Object>} Health check result
 */
async function executeHealthCheck(params) {
  const { config, actionParams } = params;

  try {
    // Step 1: Validate parameters
    const validationError = validateHealthCheckParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'health-check');
    }

    // Step 2: Simple API connectivity test (fetch 1 product)
    const testResult = await orchestrateProductRequests(
      { pageSize: 1, currentPage: 1 },
      config,
      actionParams
    );

    const isHealthy = testResult && testResult.items && Array.isArray(testResult.items);

    // Step 3: Build health result
    const healthResult = {
      health: isHealthy ? 'healthy' : 'degraded',
      connectivity: isHealthy ? 'connected' : 'connection_issues',
      responseTime: Date.now(),
      testResult: isHealthy ? 'passed' : 'failed',
    };

    // Step 4: Build success response
    return buildHealthCheckSuccessResponse(healthResult);
  } catch (error) {
    // Step 5: Build error response
    return buildHealthCheckErrorResponse(error, {
      failurePoint: 'connectivity_test',
    });
  }
}

/**
 * Handles workflow errors with comprehensive context
 * @param {Error} error - Workflow error
 * @param {Object} context - Workflow context
 * @returns {Object} Enhanced workflow error
 */
function handleWorkflowError(error, context = {}) {
  const { workflow, stage, params } = context;

  return {
    originalError: error,
    workflowContext: {
      workflow: workflow || 'unknown',
      stage: stage || 'unknown',
      params: params || {},
      timestamp: new Date().toISOString(),
    },
    enhancedMessage: `Workflow ${workflow || 'unknown'} failed at ${stage || 'unknown stage'}: ${error.message}`,
    isRetryable: !error.message.includes('Authentication') && !error.message.includes('Invalid'),
    suggestedAction: error.message.includes('Authentication')
      ? 'Check admin credentials'
      : 'Retry operation or check network connectivity',
  };
}

module.exports = {
  executeCommerceIntegration,
  executeProductListing,
  executeProductExport,
  executeHealthCheck,
  handleWorkflowError,
};
