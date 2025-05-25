/**
 * Performance testing for get-products action
 * @module src/testing/performance/get-products
 */

const { PerformanceMetrics } = require('../../actions/core/performance');
const { getProducts } = require('../../actions/backend/get-products');

/**
 * Execute get-products with performance monitoring
 * @param {Object} params - Action parameters
 * @param {Object} [logger] - Logger instance
 * @returns {Promise<Object>} Action result with performance metrics
 */
async function executeWithPerformance(params, logger = console) {
    const perf = new PerformanceMetrics(logger);
    perf.start('get-products');

    try {
        const result = await getProducts(params);
        
        // Add key metrics
        const metrics = {
            productCount: result.products?.length || 0,
            categoryCount: Object.keys(result.categoryMap || {}).length,
            fileSize: {
                original: result.originalSize,
                compressed: result.compressedSize,
                savings: result.savingsPercent
            }
        };

        perf.end('get-products', metrics);

        return {
            ...result,
            performance: {
                ...perf.getMemoryUsage(),
                metrics
            }
        };
    } catch (error) {
        perf.end('get-products', { error: error.message });
        throw error;
    }
}

module.exports = {
    executeWithPerformance
}; 