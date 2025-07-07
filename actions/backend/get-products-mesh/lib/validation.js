/**
 * Validation functions for API Mesh operations
 * @module lib/validation
 */

/**
 * Validates mesh configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validated mesh configuration
 */
function validateMeshConfiguration(config) {
  const meshEndpoint = config.mesh.endpoint;
  const meshApiKey = config.mesh.apiKey;

  if (!meshEndpoint || !meshApiKey) {
    throw new Error('Mesh configuration missing: endpoint or API key not found');
  }

  return { meshEndpoint, meshApiKey };
}

/**
 * Extracts and validates OAuth credentials from action parameters
 * @param {Object} actionParams - Action parameters
 * @returns {Object} Validated OAuth credentials
 */
function extractOAuthCredentials(actionParams) {
  const oauthCredentials = {
    consumerKey: actionParams.COMMERCE_CONSUMER_KEY,
    consumerSecret: actionParams.COMMERCE_CONSUMER_SECRET,
    accessToken: actionParams.COMMERCE_ACCESS_TOKEN,
    accessTokenSecret: actionParams.COMMERCE_ACCESS_TOKEN_SECRET,
  };

  if (
    !oauthCredentials.consumerKey ||
    !oauthCredentials.consumerSecret ||
    !oauthCredentials.accessToken ||
    !oauthCredentials.accessTokenSecret
  ) {
    throw new Error(
      'OAuth credentials required: COMMERCE_CONSUMER_KEY, COMMERCE_CONSUMER_SECRET, COMMERCE_ACCESS_TOKEN, COMMERCE_ACCESS_TOKEN_SECRET'
    );
  }

  return oauthCredentials;
}

/**
 * Validates admin credentials for inventory access
 * @param {Object} actionParams - Action parameters
 * @returns {Object} Validated admin credentials
 */
function validateAdminCredentials(actionParams) {
  if (!actionParams.COMMERCE_ADMIN_USERNAME || !actionParams.COMMERCE_ADMIN_PASSWORD) {
    throw new Error(
      'Admin credentials required for inventory: COMMERCE_ADMIN_USERNAME, COMMERCE_ADMIN_PASSWORD'
    );
  }

  return {
    adminUsername: actionParams.COMMERCE_ADMIN_USERNAME,
    adminPassword: actionParams.COMMERCE_ADMIN_PASSWORD,
  };
}

/**
 * Validates the response from the mesh API
 * @param {Object} result - API response result
 * @returns {Object} Validated mesh data
 */
function validateMeshResponse(result) {
  if (!result.data || !result.data.mesh_products_enriched) {
    throw new Error('Invalid mesh response: missing mesh_products_enriched data');
  }

  const meshData = result.data.mesh_products_enriched;
  if (!Array.isArray(meshData.products)) {
    throw new Error('Invalid mesh response: products is not an array');
  }

  return meshData;
}

module.exports = {
  validateMeshConfiguration,
  extractOAuthCredentials,
  validateAdminCredentials,
  validateMeshResponse,
};
