/**
 * Products Shared Normalization Utilities
 * Normalization functions shared across 3+ features in the products domain
 */

/**
 * Normalize product values (prices, weights, etc.) to consistent string format
 * @purpose Convert numeric product values to consistent string format for CSV export
 * @param {*} value - Value to normalize (price, weight, etc.)
 * @returns {string} Normalized value as string
 * @usedBy rest-export/transformation, mesh-export, operations/transformation
 */
function normalizeProductValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toString();
}

/**
 * Normalize product inventory values to consistent string format
 * @purpose Convert inventory quantities to consistent string format for CSV export
 * @param {*} value - Inventory value to normalize
 * @returns {string} Normalized inventory value as string
 * @usedBy rest-export/transformation, mesh-export, operations/transformation
 */
function normalizeProductInventory(value) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return '0';
  }

  return Math.round(numericValue).toString();
}

/**
 * Normalize product ID values to consistent string format
 * @purpose Convert ID values to consistent string format for data processing
 * @param {*} id - ID value to normalize
 * @returns {string} Normalized ID as string
 * @usedBy Multiple features for ID handling
 */
function normalizeId(id) {
  if (id === null || id === undefined || id === '') {
    return '';
  }

  return String(id).trim();
}

module.exports = {
  normalizeProductValue,
  normalizeProductInventory,
  normalizeId,
};
