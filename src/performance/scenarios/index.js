/**
 * Performance test scenarios configuration
 * @module src/performance/scenarios
 */

const { PerformanceMonitor } = require('../../core/monitoring/performance');
const { loadConfig } = require('../../../config');

/**
 * Get test scenarios from configuration
 * @returns {Array<Object>} List of test scenarios
 */
function getScenarios() {
    const config = loadConfig().performance.scenarios;
    return [
        {
            name: config.small.name,
            params: config.small.params
        },
        {
            name: config.medium.name,
            params: config.medium.params
        },
        {
            name: config.large.name,
            params: config.large.params
        }
    ];
}

/**
 * Execute a test scenario with performance monitoring
 * @param {Object} scenario - Test scenario configuration
 * @param {Object} [logger] - Logger instance
 * @returns {Promise<Object>} Scenario result with performance metrics
 */
async function executeScenario(scenario, logger = console) {
    const perf = new PerformanceMonitor(logger);
    perf.start(scenario.name);

    try {
        // Execute the scenario
        await Promise.resolve({ success: true }); // Placeholder for actual execution
        
        // Add key metrics
        const metrics = {
            executionTime: perf.getDuration(scenario.name),
            memory: perf.getMemoryUsage().heapUsed,
            products: scenario.params.limit,
            categories: scenario.params.limit,
            compression: null
        };

        perf.end(scenario.name, metrics);

        return {
            scenario: scenario.name,
            params: scenario.params,
            performance: metrics
        };
    } catch (error) {
        perf.end(scenario.name, { error: error.message });
        throw error;
    }
}

module.exports = {
    getScenarios,
    executeScenario
}; 