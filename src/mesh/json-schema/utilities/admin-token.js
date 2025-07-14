/**
 * Admin Token Authentication Utility for JSON Schema Resolvers
 * 
 * Handles Admin Token authentication for inventory and other admin-only endpoints.
 * Provides secure token extraction and validation.
 */

/**
 * Extract admin token from context headers
 */
function extractAdminToken(context) {
  if (!context || !context.headers) {
    throw new Error('Context or headers missing for admin token extraction');
  }

  const token = context.headers['x-commerce-admin-token'] || context.adminToken;
  
  if (!token) {
    throw new Error('Admin token required: x-commerce-admin-token header missing');
  }

  return token;
}

/**
 * Create admin token headers for API requests
 */
function createAdminTokenHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  };
}

/**
 * Validate admin token format
 */
function validateAdminToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid admin token format');
  }

  if (token.length < 10) {
    throw new Error('Admin token appears to be invalid (too short)');
  }

  return true;
}

module.exports = {
  extractAdminToken,
  createAdminTokenHeaders,
  validateAdminToken,
};
