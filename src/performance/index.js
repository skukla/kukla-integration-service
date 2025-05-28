/**
 * Performance testing module
 * @module src/performance
 */

const createBaselineManager = require('./lib/baseline-manager');
const { getScenarios, executeScenario } = require('./scenarios');
const apiTester = require('./lib/api-tester');

module.exports = {
    createBaselineManager,
    getScenarios,
    executeScenario,
    apiTester
}; 