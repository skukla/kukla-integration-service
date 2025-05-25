/**
 * Performance test configuration
 * Modify these values to adjust test scenarios
 */

module.exports = {
    // Test scenarios with different product limits
    scenarios: [
        {
            name: 'Small Dataset',
            params: {
                limit: 50,
                include_inventory: true,
                include_categories: true
            }
        },
        {
            name: 'Medium Dataset',
            params: {
                limit: 100,
                include_inventory: true,
                include_categories: true
            }
        },
        {
            name: 'Large Dataset',
            params: {
                limit: 200,
                include_inventory: true,
                include_categories: true
            }
        }
    ],

    // Default test options
    defaults: {
        environment: 'local',
        iterations: 3,
        format: 'csv'
    },

    thresholds: {
        // Allow 15% variance in execution time
        executionTime: 0.15,
        // Allow 10% variance in memory usage
        memory: 0.10,
        // Product and category counts should be exact
        products: 0,
        categories: 0,
        // Allow 5% variance in compression ratio
        compression: 0.05
    }
}; 