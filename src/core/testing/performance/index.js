const path = require('path');

const createApiTester = require('./api-tester');
const createBaselineManager = require('./baseline-manager');

/**
 * Creates a performance tester instance
 * @param {Object} options Configuration options
 * @returns {Object} Performance tester functions
 */
function createPerformanceTester(options = {}) {
  const config = {
    environment: options.environment || 'local',
    iterations: options.iterations || 1,
    format: options.format || 'json',
    baselineFile: options.baselineFile || path.join(process.cwd(), 'config/baseline-metrics.json'),
    commerceUrl: process.env.COMMERCE_BASE_URL,
    includeAnalysis: options.includeAnalysis || false,
  };

  const baselineManager = createBaselineManager({
    baselineFile: config.baselineFile,
  });

  /**
   * Executes a test with detailed analysis for mesh actions
   * @param {string} actionName Action to test
   * @param {Object} params Action parameters
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results with optional analysis
   */
  async function executeTestWithAnalysis(actionName, params, onProgress) {
    // Import the specific action dynamically
    const actionPath = path.join(process.cwd(), 'actions/backend', actionName);
    const { main } = require(actionPath);

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      if (onProgress) await onProgress(`Running ${actionName} test...`);

      const result = await main(params);

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const basicMetrics = {
        executionTime: endTime - startTime,
        memory: endMemory - startMemory,
        success: !!result,
      };

      // For mesh actions, extract detailed analysis if available
      if (actionName.includes('mesh') && result?.analysis) {
        return {
          ...basicMetrics,
          analysis: result.analysis,
          apiCalls: result.apiCalls || 0,
          breakdown: result.breakdown,
          recommendations: result.recommendations,
        };
      }

      return basicMetrics;
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      return {
        executionTime: endTime - startTime,
        memory: endMemory - startMemory,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Executes a local test
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function executeLocalTest(scenario, onProgress) {
    const rawParams = {
      __ow_query: { env: 'dev' },
      ...scenario.params,
      LOG_LEVEL: 'info',
      COMMERCE_BASE_URL: process.env.COMMERCE_BASE_URL,
      COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
      COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD,
      COMMERCE_CONSUMER_KEY: process.env.COMMERCE_CONSUMER_KEY,
      COMMERCE_CONSUMER_SECRET: process.env.COMMERCE_CONSUMER_SECRET,
      COMMERCE_ACCESS_TOKEN: process.env.COMMERCE_ACCESS_TOKEN,
      COMMERCE_ACCESS_TOKEN_SECRET: process.env.COMMERCE_ACCESS_TOKEN_SECRET,
      NODE_ENV: 'staging',
    };

    // Use enhanced testing if analysis is requested
    if (config.includeAnalysis || scenario.analysis) {
      return await executeTestWithAnalysis(scenario.action, rawParams, onProgress);
    }

    // Fallback to original testing for compatibility
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const actionPath = path.join(process.cwd(), 'actions/backend', scenario.action);
      const { main } = require(actionPath);

      if (onProgress) await onProgress('Running local test...');
      await main(rawParams);
    } catch (error) {
      console.warn('Local test error:', error.message);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      executionTime: endTime - startTime,
      memory: endMemory - startMemory,
    };
  }

  /**
   * Executes a deployed test
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function executeDeployedTest(scenario, onProgress) {
    const apiConfig = {
      deployed: {
        baseUrl: process.env.API_BASE_URL,
        auth: {
          commerceUrl: process.env.COMMERCE_BASE_URL,
          commerceAdminUsername: process.env.COMMERCE_ADMIN_USERNAME,
          commerceAdminPassword: process.env.COMMERCE_ADMIN_PASSWORD,
        },
      },
    };

    const apiTester = createApiTester(apiConfig.deployed);
    const result = await apiTester.testProducts(scenario.params, onProgress);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.metrics;
  }

  /**
   * Runs a comparative test between multiple actions
   * @param {Array} actions Actions to compare
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Comparison results
   */
  async function runComparativeTest(actions, scenario, onProgress) {
    const results = {};

    for (const action of actions) {
      const actionScenario = { ...scenario, action };

      if (onProgress) await onProgress(`Testing ${action}...`);

      try {
        const result = await executeLocalTest(actionScenario, onProgress);
        results[action] = result;
      } catch (error) {
        results[action] = { error: error.message, executionTime: 0 };
      }
    }

    // Calculate comparison metrics
    const [firstAction, secondAction] = actions;
    const first = results[firstAction];
    const second = results[secondAction];

    // Check if both tests succeeded
    if (first.error || second.error || !first.executionTime || !second.executionTime) {
      return {
        individual: results,
        comparison: {
          error: 'One or both tests failed',
          withinTolerance: false,
        },
      };
    }

    const percentDifference =
      ((second.executionTime - first.executionTime) / first.executionTime) * 100;
    const winner = first.executionTime < second.executionTime ? firstAction : secondAction;

    const tolerance = scenario.comparison?.tolerancePercent || 20;
    const withinTolerance = Math.abs(percentDifference) <= tolerance;

    return {
      individual: results,
      comparison: {
        percentDifference: Math.abs(percentDifference),
        fasterAction: winner,
        slowerAction: winner === firstAction ? secondAction : firstAction,
        withinTolerance,
      },
    };
  }

  /**
   * Runs batch optimization testing
   * @param {Object} scenario Batch testing scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Optimization results
   */
  async function runBatchOptimization(scenario, onProgress) {
    const results = [];

    for (const variant of scenario.variants) {
      const variantScenario = {
        ...scenario,
        params: { ...scenario.params, ...variant.params },
      };

      if (onProgress) await onProgress(`Testing ${variant.name}...`);

      const result = await executeLocalTest(variantScenario, onProgress);
      results.push({
        ...result,
        name: variant.name,
        params: variant.params,
        expectedTime: variant.expectedTime,
        meetsExpectation: variant.expectedTime
          ? result.executionTime <= variant.expectedTime
          : true,
      });
    }

    // Find optimal configuration
    const optimal = results.reduce((best, current) =>
      current.executionTime < best.executionTime ? current : best
    );

    return {
      variants: results,
      optimal: {
        name: optimal.name,
        params: optimal.params,
        executionTime: optimal.executionTime,
      },
      analysis: {
        fastestTime: Math.min(...results.map((r) => r.executionTime)),
        slowestTime: Math.max(...results.map((r) => r.executionTime)),
        averageTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
      },
    };
  }

  /**
   * Runs a test scenario
   * @param {Object} scenario Test scenario
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} Test results
   */
  async function runTest(scenario, onProgress = () => {}) {
    // Handle different scenario types
    if (scenario.actions && scenario.actions.length > 1) {
      // Comparative testing
      return await runComparativeTest(scenario.actions, scenario, onProgress);
    }

    if (scenario.variants && scenario.variants.length > 0) {
      // Batch optimization testing
      return await runBatchOptimization(scenario, onProgress);
    }

    // Standard single-action testing
    const results = {
      local: [],
      deployed: [],
    };

    // Check if we need to establish new baselines
    if (['local', 'both'].includes(config.environment)) {
      const { needsBaseline } = baselineManager.checkBaseline(scenario.name, 'local');

      for (let i = 0; i < config.iterations; i++) {
        const metrics = await executeLocalTest(scenario, onProgress);
        results.local.push(metrics);

        // Save as baseline if needed and this is the first iteration
        if (needsBaseline && i === 0) {
          baselineManager.saveBaseline(scenario.name, metrics, 'local');
        } else if (i === 0) {
          // Compare with existing baseline
          baselineManager.compareWithBaseline(scenario.name, metrics, 'local');
        }
      }
    }

    if (['deployed', 'both'].includes(config.environment)) {
      const { needsBaseline } = baselineManager.checkBaseline(scenario.name, 'deployed');

      for (let i = 0; i < config.iterations; i++) {
        const metrics = await executeDeployedTest(scenario, onProgress);
        results.deployed.push(metrics);

        // Save as baseline if needed and this is the first iteration
        if (needsBaseline && i === 0) {
          baselineManager.saveBaseline(scenario.name, metrics, 'deployed');
        } else if (i === 0) {
          // Compare with existing baseline
          baselineManager.compareWithBaseline(scenario.name, metrics, 'deployed');
        }
      }
    }

    return results;
  }

  return {
    runTest,
    executeLocalTest,
    executeDeployedTest,
    runComparativeTest,
    runBatchOptimization,
  };
}

/**
 * Test a scenario with thresholds and baseline comparison
 * @param {Object} scenario Test scenario
 * @param {Object} options Test options
 * @returns {Promise<Object>} Test results
 */
async function testScenario(scenario, options = {}) {
  const tester = createPerformanceTester({
    environment: options.environment || 'local',
    iterations: options.iterations || 1,
    includeAnalysis: scenario.analysis || options.includeAnalysis,
  });

  try {
    const results = await tester.runTest(scenario);

    // Handle different result types
    if (results.comparison) {
      // Comparative test results
      return {
        passed: results.comparison.withinTolerance,
        type: 'comparative',
        results: results.individual,
        comparison: results.comparison,
        scenario: scenario.name,
      };
    }

    if (results.optimal) {
      // Batch optimization results
      return {
        passed: true,
        type: 'optimization',
        optimal: results.optimal,
        variants: results.variants,
        analysis: results.analysis,
        scenario: scenario.name,
      };
    }

    // Standard test results
    const metrics = results.deployed?.[0] || results.local?.[0];

    // Check if test actually succeeded (has execution time and no error)
    const testSucceeded = metrics && metrics.executionTime > 0 && !metrics.error;

    let metricsValidation = true;
    if (scenario.expectedMetrics) {
      metricsValidation = Object.entries(scenario.expectedMetrics).every(([key, expected]) => {
        // Map expected metric names to actual metric keys
        let actualKey = key;
        if (key === 'maxExecutionTime') actualKey = 'executionTime';
        if (key === 'maxMemory') actualKey = 'memory';
        if (key === 'maxMemoryUsage') actualKey = 'memory';
        if (key === 'minProductCount') actualKey = 'productCount';
        if (key === 'maxApiCalls') actualKey = 'apiCalls';

        const actual = metrics[actualKey];
        let passes = true;

        if (key.startsWith('max')) {
          passes = actual <= expected;
        } else if (key.startsWith('min')) {
          passes = actual >= expected;
        }

        return passes;
      });
    }

    const passed = testSucceeded && metricsValidation;

    return {
      passed,
      type: 'standard',
      metrics,
      scenario: scenario.name,
      analysis: metrics?.analysis,
      recommendations: metrics?.recommendations,
      error: !testSucceeded ? metrics?.error || 'Test execution failed' : undefined,
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      scenario: scenario.name,
    };
  }
}

module.exports = {
  createPerformanceTester,
  testScenario,
};
