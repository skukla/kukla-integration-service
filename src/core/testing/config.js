/**
 * Default configuration for API testing
 */
const defaultConfig = {
  // Default fields for product tests
  products: {
    defaultFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
  },

  // Default timeouts and retries
  request: {
    timeout: 30000,
    retries: 2,
    retryDelay: 1000,
  },

  // Validation settings
  validation: {
    warnOnEmptyArrays: true,
    requireSuccessField: true,
  },
};

/**
 * Get configuration with optional overrides
 * @param {Object} overrides - Override default config values
 * @returns {Object} Final configuration
 */
function getConfig(overrides = {}) {
  return {
    ...defaultConfig,
    ...overrides,
    products: {
      ...defaultConfig.products,
      ...overrides.products,
    },
    request: {
      ...defaultConfig.request,
      ...overrides.request,
    },
    validation: {
      ...defaultConfig.validation,
      ...overrides.validation,
    },
  };
}

module.exports = {
  defaultConfig,
  getConfig,
};
