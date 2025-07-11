/**
 * Test Domain - Performance Operations
 * Business operations for performance testing
 */

const { buildActionUrl } = require('./url-building');
const format = require('../../core/formatting');

/**
 * Available performance test scenarios
 */
const SCENARIOS = {
  quick: {
    name: 'Quick Test',
    description: 'Fast performance check (5 requests)',
    requests: 5,
    concurrency: 1,
  },
  load: {
    name: 'Load Test',
    description: 'Standard load testing (20 requests, 5 concurrent)',
    requests: 20,
    concurrency: 5,
  },
  stress: {
    name: 'Stress Test',
    description: 'High load testing (50 requests, 10 concurrent)',
    requests: 50,
    concurrency: 10,
  },
  baseline: {
    name: 'Baseline Test',
    description: 'Single request for baseline measurement',
    requests: 1,
    concurrency: 1,
  },
};

/**
 * Get available performance test scenarios
 * @returns {Array<string>} Available scenario names
 */
function getAvailableScenarios() {
  return Object.keys(SCENARIOS);
}

/**
 * Get scenario configuration
 * @param {string} scenarioName - Scenario name
 * @returns {Object|null} Scenario configuration or null if not found
 */
function getScenario(scenarioName) {
  return SCENARIOS[scenarioName] || null;
}

/**
 * Display available scenarios with beautiful formatting
 */
function displayScenarios() {
  console.log(format.section('📊 Available Performance Test Scenarios:'));
  console.log();

  Object.entries(SCENARIOS).forEach(([key, scenario]) => {
    console.log(format.info(`${key}: ${scenario.name}`));
    console.log(format.muted(`   ${scenario.description}`));
    console.log(
      format.muted(`   ${scenario.requests} requests, ${scenario.concurrency} concurrent`)
    );
    console.log();
  });
}

/**
 * Execute single API request for performance measurement
 * @param {string} url - API URL
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Performance result
 */
async function executePerformanceRequest(url, params = {}) {
  const fetch = require('node-fetch');
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      duration,
      timestamp: startTime,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      error: error.message,
      duration: endTime - startTime,
      timestamp: startTime,
    };
  }
}

/**
 * Execute performance test with batching
 * @param {string} actionName - Action to test
 * @param {Object} scenario - Scenario configuration
 * @param {Object} params - Request parameters
 * @param {boolean} isProd - Whether testing in production
 * @returns {Promise<Array>} Performance results
 */
async function executeBatchedPerformanceTest(actionName, scenario, params, isProd) {
  const apiUrl = buildActionUrl(actionName, params, isProd);
  const results = [];
  const batches = Math.ceil(scenario.requests / scenario.concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(
      scenario.concurrency,
      scenario.requests - batch * scenario.concurrency
    );
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      promises.push(executePerformanceRequest(apiUrl, params));
    }

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Show progress
    const completed = Math.min((batch + 1) * scenario.concurrency, scenario.requests);
    console.log(format.muted(`   Completed: ${completed}/${scenario.requests} requests`));
  }

  return results;
}

/**
 * Calculate performance statistics
 * @param {Array} results - Performance results
 * @returns {Object} Performance statistics
 */
function calculatePerformanceStats(results) {
  const successfulResults = results.filter((r) => r.success);
  const durations = successfulResults.map((r) => r.duration);

  return {
    total: results.length,
    successful: successfulResults.length,
    failed: results.length - successfulResults.length,
    successRate: (successfulResults.length / results.length) * 100,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    medianDuration: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
  };
}

/**
 * Display performance results with beautiful formatting
 * @param {Object} stats - Performance statistics
 */
function displayPerformanceResults(stats) {
  console.log();
  console.log(format.success('✅ Performance test completed'));
  console.log();
  console.log(format.section('📈 Performance Results:'));
  console.log();

  console.log(
    format.info(
      `Requests: ${stats.successful}/${stats.total} successful (${stats.successRate.toFixed(1)}%)`
    )
  );
  console.log(
    format.info(
      `Duration: ${stats.minDuration}ms min, ${stats.avgDuration.toFixed(0)}ms avg, ${stats.maxDuration}ms max`
    )
  );
  console.log(format.info(`Median: ${stats.medianDuration}ms`));

  if (stats.failed > 0) {
    console.log(format.warning(`⚠️  ${stats.failed} requests failed`));
  }
}

module.exports = {
  getAvailableScenarios,
  getScenario,
  displayScenarios,
  executePerformanceRequest,
  executeBatchedPerformanceTest,
  calculatePerformanceStats,
  displayPerformanceResults,
};
