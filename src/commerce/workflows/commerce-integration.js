/**
 * Commerce Integration Workflows
 *
 * Commerce API integration workflows and orchestration
 */

const {
  orchestrateProductRequests,
  orchestrateProductEnrichment,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const { orchestrateDataProcessing } = require('../operations/data-processing');
const { buildSuccessResponse, buildErrorResponse } = require('../operations/response-building');
const {
  validateCommerceIntegrationParams,
  validateProductListingParams,
  validateHealthCheckParams,
  createValidationErrorResponse,
} = require('../operations/validation');

// === INTEGRATION WORKFLOWS ===

/**
 * Complete Commerce API integration workflow
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
    const validationError = validateCommerceIntegrationParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'commerce-integration');
    }

    const enrichmentResult = await retryWithAuthHandling(
      () => orchestrateProductEnrichment(query, config, actionParams, trace),
      { maxRetries: 2, retryDelay: 1000 }
    );

    const processingResult = orchestrateDataProcessing(enrichmentResult, config, options);
    return buildSuccessResponse(processingResult);
  } catch (error) {
    return buildErrorResponse(error, {
      workflow: 'commerce-integration',
      query: JSON.stringify(query),
    });
  }
}

/**
 * Product listing workflow
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
    const validationError = validateProductListingParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'product-listing');
    }

    const productResult = await orchestrateProductRequests(
      listingParams,
      config,
      actionParams,
      trace
    );

    const processed = orchestrateDataProcessing({ products: productResult.items || [] }, config);

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

    return buildSuccessResponse(listingResult);
  } catch (error) {
    return buildErrorResponse(error, {
      listingParams: JSON.stringify(listingParams),
    });
  }
}

/**
 * Product export workflow
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
    const integrationResult = await executeCommerceIntegration({
      query: exportParams,
      config,
      actionParams,
      trace,
      options: {
        fields: exportParams.fields,
        validate: true,
      },
    });

    if (!integrationResult.success) {
      return integrationResult;
    }

    const exportResult = {
      exportData: integrationResult.data.products,
      exportMetadata: {
        ...integrationResult.metadata,
        exportFields: exportParams.fields || 'all',
        workflow: 'product-export',
      },
    };

    return buildSuccessResponse(exportResult);
  } catch (error) {
    return buildErrorResponse(error, {
      stage: 'product-export',
      dataType: 'product',
      exportParams: JSON.stringify(exportParams),
    });
  }
}

// === UTILITY WORKFLOWS ===

/**
 * Health check workflow for Commerce API
 * @param {Object} params - Workflow parameters
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @returns {Promise<Object>} Health check result
 */
async function executeHealthCheck(params) {
  const { config, actionParams } = params;

  try {
    const validationError = validateHealthCheckParams(params);
    if (validationError) {
      return createValidationErrorResponse(validationError, 'health-check');
    }

    const testResult = await orchestrateProductRequests(
      { pageSize: 1, currentPage: 1 },
      config,
      actionParams
    );

    const isHealthy = testResult && testResult.items && Array.isArray(testResult.items);

    const healthResult = {
      health: isHealthy ? 'healthy' : 'degraded',
      connectivity: isHealthy ? 'connected' : 'connection_issues',
      responseTime: Date.now(),
      testResult: isHealthy ? 'passed' : 'failed',
    };

    return buildSuccessResponse(healthResult);
  } catch (error) {
    return buildErrorResponse(error, {
      failurePoint: 'connectivity_test',
    });
  }
}

/**
 * Handle workflow errors with comprehensive context
 * @param {Error} error - Workflow error
 * @param {Object} [context={}] - Workflow context
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
  // Main integration workflows
  executeCommerceIntegration,
  executeProductListing,
  executeProductExport,

  // Utility workflows
  executeHealthCheck,
  handleWorkflowError,
};
