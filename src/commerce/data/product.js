/**
 * Product data configuration and validation
 * @module commerce/data/product
 */

const {
  getProductFields,
  getRequestedFields,
  validateProduct,
  PRODUCT_FIELDS,
} = require('../../products/validate');

// Get default fields for backward compatibility (will use cached config from products domain)
// This is a transitional export for backward compatibility
const CACHED_PRODUCT_FIELDS = PRODUCT_FIELDS;

module.exports = {
  PRODUCT_FIELDS: CACHED_PRODUCT_FIELDS,
  getProductFields,
  getRequestedFields,
  validateProduct,
};
