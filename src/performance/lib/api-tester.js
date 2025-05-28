const axios = require('axios');

/**
 * Tests the deployed API endpoint
 * @param {Object} options Configuration options
 * @param {string} options.baseUrl Base URL of the deployed API
 * @param {Object} options.auth Authentication credentials
 * @param {string} options.auth.commerceUrl Commerce URL
 * @param {string} options.auth.commerceAdminUsername Admin username
 * @param {string} options.auth.commerceAdminPassword Admin password
 * @param {number} options.limit Product limit for the test
 * @param {Function} [options.onProgress] Progress callback
 * @returns {Promise<Object>} Test results
 */
async function testDeployedApi({ baseUrl, auth, limit, onProgress }) {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        if (onProgress) {
            await onProgress('Authenticating...');
        }

        if (onProgress) {
            await onProgress('Fetching products...');
        }

        const response = await axios.get(`${baseUrl}/get-products`, {
            params: {
                commerce_url: auth.commerceUrl,
                commerce_admin_username: auth.commerceAdminUsername,
                commerce_admin_password: auth.commerceAdminPassword,
                format: 'csv',
                env: 'prod',
                limit
            }
        });

        if (onProgress) {
            await onProgress('Enriching with inventory data...');
        }

        if (onProgress) {
            await onProgress('Building category map...');
        }

        const endTime = process.hrtime(startTime);
        const endMemory = process.memoryUsage().heapUsed;
        const executionTime = endTime[0] + endTime[1] / 1e9; // Convert to seconds
        const memoryUsed = Math.abs(endMemory - startMemory) / 1024 / 1024; // Convert to MB

        // Extract metrics from response
        const { performance } = response.data;

        // Ensure we use the API's memory metrics if available, otherwise use our local measurement
        const memoryMetrics = performance?.memory?.peak ? 
            { peak: Math.abs(performance.memory.peak) } : 
            { peak: memoryUsed };

        return {
            success: true,
            metrics: {
                executionTime,
                memoryUsed,
                performance: {
                    ...performance,
                    memory: memoryMetrics
                }
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

module.exports = {
    testDeployedApi
}; 