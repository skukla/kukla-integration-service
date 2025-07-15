/**
 * Commerce Integration Workflows
 *
 * High-level orchestration functions for complete Commerce API integration workflows.
 * Coordinates authentication, API requests, and data processing for business operations.
 */

const {
  orchestrateProductRequests,
  orchestrateProductEnrichment,
  handleApiRequestError,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const {
  orchestrateDataProcessing,
  handleDataProcessingError,
} = require('../operations/data-processing');
const { validateAdminCredentials } = require('../utils/admin-auth');

/**
 * Executes a complete Commerce API integration workflow
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
    // Step 1: Validate admin credentials
    if (!validateAdminCredentials(actionParams)) {
      throw new Error(
        'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required'
      );
    }

    // Step 2: Execute product enrichment with retry handling
    const enrichmentResult = await retryWithAuthHandling(
      () => orchestrateProductEnrichment(query, config, actionParams, trace),
      { maxRetries: 2, retryDelay: 1000 }
    );

    // Step 3: Process the enriched data
    const processingResult = orchestrateDataProcessing(enrichmentResult, config, options);

    return {
      success: true,
      data: processingResult,
      metadata: {
        timestamp: new Date().toISOString(),
        totalProducts: processingResult.products.length,
        processingStats: processingResult.processing,
      },
    };
  } catch (error) {
    // Enhanced error handling with context
    const enhancedError = handleApiRequestError(error, {
      workflow: 'commerce-integration',
      query: JSON.stringify(query),
    });

    return {
      success: false,
      error: enhancedError,
      metadata: {
        timestamp: new Date().toISOString(),
        failurePoint: 'commerce-integration',
      },
    };
  }
}

/**
 * Executes a product listing workflow
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
    // Execute product request without full enrichment for listing
    const productResult = await orchestrateProductRequests(
      listingParams,
      config,
      actionParams,
      trace
    );

    // Process basic product data
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

    return {
      success: true,
      products: processed.products,
      pagination: {
        currentPage: listingParams.currentPage || 1,
        pageSize: listingParams.pageSize || 20,
        totalCount: productResult.total_count || 0,
        totalPages: Math.ceil((productResult.total_count || 0) / (listingParams.pageSize || 20)),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        resultCount: processed.products.length,
      },
    };
  } catch (error) {
    const enhancedError = handleApiRequestError(error, {
      workflow: 'product-listing',
      listingParams: JSON.stringify(listingParams),
    });

    return {
      success: false,
      error: enhancedError,
      metadata: {
        timestamp: new Date().toISOString(),
        failurePoint: 'product-listing',
      },
    };
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
    // Execute complete integration for export
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

    return {
      success: true,
      exportData: integrationResult.data.products,
      exportMetadata: {
        ...integrationResult.metadata,
        exportFields: exportParams.fields || 'all',
        workflow: 'product-export',
      },
    };
  } catch (error) {
    const enhancedError = handleDataProcessingError(error, {
      stage: 'product-export',
      dataType: 'product',
      exportParams: JSON.stringify(exportParams),
    });

    return {
      success: false,
      error: enhancedError,
      metadata: {
        timestamp: new Date().toISOString(),
        failurePoint: 'product-export',
      },
    };
  }
}

/**
 * Executes a health check workflow for Commerce API
 * @param {Object} params - Workflow parameters
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @returns {Promise<Object>} Health check result
 */
async function executeHealthCheck(params) {
  const { config, actionParams } = params;

  try {
    // Simple authentication validation
    const authValidation = validateAdminCredentials(actionParams);
    if (!authValidation) {
      return {
        success: false,
        health: 'unhealthy',
        issues: ['authentication_invalid'],
        details: 'Admin credentials are invalid',
        metadata: {
          timestamp: new Date().toISOString(),
          check: 'health-check',
        },
      };
    }

    // Simple API connectivity test (fetch 1 product)
    const testResult = await orchestrateProductRequests(
      { pageSize: 1, currentPage: 1 },
      config,
      actionParams
    );

    const isHealthy = testResult && testResult.items && Array.isArray(testResult.items);

    return {
      success: true,
      health: isHealthy ? 'healthy' : 'degraded',
      connectivity: isHealthy ? 'connected' : 'connection_issues',
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now(),
        check: 'health-check',
        testResult: isHealthy ? 'passed' : 'failed',
      },
    };
  } catch (error) {
    return {
      success: false,
      health: 'unhealthy',
      error: error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        check: 'health-check',
        failurePoint: 'connectivity_test',
      },
    };
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
