/**
 * Main action for exporting Adobe Commerce product data
 * @module get-products
 */

// Test without domain catalogs first
const { loadConfig } = require('../../../config');

/**
 * Main function for get-products action
 * @param {Object} params - Action parameters
 * @returns {Promise<Object>} Response object
 */
async function main(params) {
  try {
    // Test if basic config works
    const config = loadConfig(params);

    // Test basic response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Basic test working',
        test: {
          config: typeof config,
          configKeys: Object.keys(config).slice(0, 5), // First 5 keys
        },
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}

module.exports = { main };
