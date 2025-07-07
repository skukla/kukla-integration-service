/**
 * Adobe Commerce integration module
 * @module commerce
 */

const api = require('./api');
const data = require('./data');
const transform = require('./transform');

/**
 * Commerce Domain Catalog
 *
 * This catalog will export all Commerce API integration functionality including:
 * - OAuth authentication
 * - Commerce API calls
 * - URL building for Commerce endpoints
 *
 * Following functional composition principles - each function will be pure
 * with clear input/output contracts.
 *
 * To be populated in Phase 4 with functions moved from:
 * - src/commerce/api/
 * - actions/backend/get-products/lib/auth.js
 */

module.exports = {
  // API client and endpoints
  api,

  // Data validation and handling
  data,

  // Data transformation utilities
  transform,

  // Will be populated in Phase 4:
  // createOAuthHeader: require('./auth').createOAuthHeader,
  // callCommerceApi: require('./api').callCommerceApi,
  // buildCommerceUrl: require('./api').buildCommerceUrl,
};
