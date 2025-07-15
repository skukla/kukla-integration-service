/**
 * Commerce Validation Operations
 *
 * Mid-level business logic for validating commerce workflow inputs.
 * Contains operations that validate credentials, parameters, and business rules.
 */

const { validateAdminCredentials } = require('../utils/admin-auth');

/**
 * Validate commerce integration workflow parameters
 * Business operation that validates all required parameters for commerce integration.
 *
 * @param {Object} params - Workflow parameters to validate
 * @param {Object} params.query - Query parameters for API requests
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters including admin credentials
 * @param {Object} [params.options] - Processing options
 * @returns {Object|null} Validation error object or null if valid
 */
function validateCommerceIntegrationParams(params) {
  const { query, config, actionParams } = params;

  // Validate admin credentials
  if (!validateAdminCredentials(actionParams)) {
    return {
      valid: false,
      error:
        'Missing admin credentials: COMMERCE_ADMIN_USERNAME and COMMERCE_ADMIN_PASSWORD required',
      type: 'AUTHENTICATION_ERROR',
    };
  }

  // Validate required configuration
  if (!config || !config.commerce) {
    return {
      valid: false,
      error: 'Missing commerce configuration',
      type: 'CONFIGURATION_ERROR',
    };
  }

  // Validate query parameters
  if (!query || typeof query !== 'object') {
    return {
      valid: false,
      error: 'Invalid query parameters: must be an object',
      type: 'PARAMETER_ERROR',
    };
  }

  return null; // Valid
}

/**
 * Validate product enrichment workflow parameters
 * Business operation that validates parameters for product enrichment workflows.
 *
 * @param {Object} params - Enrichment parameters to validate
 * @param {Array<Object>} params.products - Base product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.options] - Enrichment options
 * @returns {Object|null} Validation error object or null if valid
 */
function validateProductEnrichmentParams(params) {
  const { products, config, actionParams } = params;

  // Validate admin credentials
  if (!validateAdminCredentials(actionParams)) {
    return {
      valid: false,
      error: 'Missing admin credentials for product enrichment',
      type: 'AUTHENTICATION_ERROR',
    };
  }

  // Validate products array
  if (!Array.isArray(products)) {
    return {
      valid: false,
      error: 'Invalid products: must be an array',
      type: 'PARAMETER_ERROR',
    };
  }

  // Validate configuration
  if (!config || !config.commerce) {
    return {
      valid: false,
      error: 'Missing commerce configuration for enrichment',
      type: 'CONFIGURATION_ERROR',
    };
  }

  return null; // Valid
}

/**
 * Validate product listing workflow parameters
 * Business operation that validates parameters for product listing workflows.
 *
 * @param {Object} params - Listing parameters to validate
 * @returns {Object|null} Validation error object or null if valid
 */
function validateProductListingParams(params) {
  const { listingParams, config, actionParams } = params;

  // Validate admin credentials
  if (!validateAdminCredentials(actionParams)) {
    return {
      valid: false,
      error: 'Missing admin credentials for product listing',
      type: 'AUTHENTICATION_ERROR',
    };
  }

  // Validate listing parameters
  if (!listingParams || typeof listingParams !== 'object') {
    return {
      valid: false,
      error: 'Invalid listing parameters: must be an object',
      type: 'PARAMETER_ERROR',
    };
  }

  // Validate configuration
  if (!config || !config.commerce) {
    return {
      valid: false,
      error: 'Missing commerce configuration for listing',
      type: 'CONFIGURATION_ERROR',
    };
  }

  return null; // Valid
}

/**
 * Validate health check parameters
 * Business operation that validates parameters for health check workflows.
 *
 * @param {Object} params - Health check parameters to validate
 * @returns {Object|null} Validation error object or null if valid
 */
function validateHealthCheckParams(params) {
  const { config, actionParams } = params;

  // Validate admin credentials
  if (!validateAdminCredentials(actionParams)) {
    return {
      valid: false,
      error: 'Missing admin credentials for health check',
      type: 'AUTHENTICATION_ERROR',
    };
  }

  // Validate configuration
  if (!config || !config.commerce) {
    return {
      valid: false,
      error: 'Missing commerce configuration for health check',
      type: 'CONFIGURATION_ERROR',
    };
  }

  return null; // Valid
}

/**
 * Create validation error response
 * Business operation that creates standardized error response for validation failures.
 *
 * @param {Object} validationError - Validation error object from validation operation
 * @param {string} workflow - Name of the workflow that failed validation
 * @returns {Object} Standardized error response
 */
function createValidationErrorResponse(validationError, workflow) {
  return {
    success: false,
    error: {
      message: validationError.error,
      type: validationError.type,
      workflow,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      failurePoint: 'validation',
      workflow,
    },
  };
}

module.exports = {
  validateCommerceIntegrationParams,
  validateProductEnrichmentParams,
  validateProductListingParams,
  validateHealthCheckParams,
  createValidationErrorResponse,
};
