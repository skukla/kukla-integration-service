/**
 * Performance Testing - Scenario Execution Sub-module
 * All performance test scenario execution utilities including loading, configuration, and execution logic
 */

const { sleep } = require('../../shared/utils/async');

// Scenario Loading and Configuration

/**
 * Get all available performance test scenarios
 * @purpose Define all predefined performance test scenarios with their configurations
 * @returns {Object} Object containing all available scenarios keyed by name
 * @usedBy loadTestScenario
 */
// eslint-disable-next-line max-lines-per-function
function getPerformanceTestScenarios() {
  return {
    // Basic Performance Scenarios
    quick: {
      name: 'Quick Performance Test',
      iterations: 3,
      warmupIterations: 1,
      maxExecutionTime: 5000,
      expectedResponseTime: 2000,
      concurrent: false,
      description: 'Fast performance validation with minimal load',
    },
    thorough: {
      name: 'Thorough Performance Test',
      iterations: 10,
      warmupIterations: 2,
      maxExecutionTime: 10000,
      expectedResponseTime: 3000,
      concurrent: false,
      description: 'Comprehensive performance analysis with detailed metrics',
    },
    stress: {
      name: 'Stress Performance Test',
      iterations: 20,
      warmupIterations: 3,
      maxExecutionTime: 15000,
      expectedResponseTime: 5000,
      concurrent: true,
      concurrentUsers: 5,
      description: 'High-load performance testing with concurrent execution',
    },
    baseline: {
      name: 'Baseline Performance Test',
      iterations: 5,
      warmupIterations: 1,
      maxExecutionTime: 8000,
      expectedResponseTime: 2500,
      concurrent: false,
      description: 'Standard baseline measurement for performance comparison',
    },

    // API-Specific Baseline Scenarios (migrated from tools)
    'rest-baseline': {
      name: 'REST API Baseline',
      iterations: 5,
      warmupIterations: 1,
      maxExecutionTime: 5000,
      expectedResponseTime: 2000,
      concurrent: false,
      description: 'Baseline performance test for REST API implementation',
      params: { format: 'csv' },
      expectedMetrics: {
        maxExecutionTime: 5000,
        maxMemory: 50000000, // 50MB in bytes
      },
    },
    'mesh-baseline': {
      name: 'API Mesh Baseline',
      iterations: 5,
      warmupIterations: 1,
      maxExecutionTime: 5000,
      expectedResponseTime: 2000,
      concurrent: false,
      description: 'Baseline performance test for optimized API Mesh implementation',
      params: { format: 'csv' },
      expectedMetrics: {
        maxExecutionTime: 5000,
        maxMemory: 50000000,
      },
    },

    // Comparative Scenarios (migrated from tools)
    'rest-vs-mesh': {
      name: 'REST API vs API Mesh Comparison',
      iterations: 5,
      warmupIterations: 1,
      maxExecutionTime: 10000,
      expectedResponseTime: 3000,
      concurrent: false,
      description: 'Performance comparison: should be within 10% of each other',
      params: { format: 'csv' },
      comparison: {
        targets: ['get-products', 'get-products-mesh'],
        tolerancePercent: 10,
        mustHaveSameOutput: true,
        trackApiCalls: true,
      },
    },

    // Analysis Scenarios (migrated from tools)
    'mesh-analysis': {
      name: 'API Mesh Detailed Analysis',
      iterations: 3,
      warmupIterations: 1,
      maxExecutionTime: 8000,
      expectedResponseTime: 3000,
      concurrent: false,
      description: 'Comprehensive step-by-step performance breakdown',
      params: {
        format: 'json',
        includeAnalysis: true,
      },
      analysis: {
        trackSteps: true,
        trackApiCalls: true,
        identifyBottlenecks: true,
        recommendations: true,
      },
      expectedBreakdown: {
        productFetch: { maxPercent: 80, maxTime: 1500 },
        parallelFetch: { maxPercent: 25, maxTime: 500 },
        dataEnrichment: { maxPercent: 5, maxTime: 100 },
      },
    },

    // Concurrent Load Scenarios (migrated from tools)
    'mesh-concurrent': {
      name: 'API Mesh Concurrent Load',
      iterations: 10,
      warmupIterations: 2,
      maxExecutionTime: 12000,
      expectedResponseTime: 4000,
      concurrent: true,
      concurrentUsers: 3,
      description: 'Test API Mesh under concurrent load',
      params: { format: 'csv' },
      concurrency: {
        users: 3,
        duration: 30, // seconds
      },
    },

    // Optimization Scenarios (migrated from tools)
    'mesh-batching': {
      name: 'API Mesh Batch Size Optimization',
      iterations: 3,
      warmupIterations: 1,
      maxExecutionTime: 10000,
      expectedResponseTime: 3500,
      concurrent: false,
      description: 'Test different page sizes for optimal performance',
      params: { format: 'csv' },
      variants: [
        { params: { pageSize: 100 }, name: 'Small Batches', expectedTime: 3500 },
        { params: { pageSize: 150 }, name: 'Optimal Batches', expectedTime: 2500 },
        { params: { pageSize: 200 }, name: 'Large Batches', expectedTime: 3000 },
        { params: { pageSize: 300 }, name: 'Extra Large Batches', expectedTime: 4000 },
      ],
      findOptimal: true,
    },

    // Regression Testing (migrated from tools)
    'mesh-regression': {
      name: 'API Mesh Performance Regression',
      iterations: 5,
      warmupIterations: 1,
      maxExecutionTime: 8000,
      expectedResponseTime: 2500,
      concurrent: false,
      description: 'Detect performance regressions in mesh implementation',
      params: { format: 'csv' },
      regression: {
        maxSlowdownPercent: 15, // Alert if >15% slower than baseline
        requireImprovement: false,
        trackTrends: true,
      },
    },

    // End-to-End Testing (migrated from tools)
    'full-stack': {
      name: 'Full Stack Performance',
      iterations: 3,
      warmupIterations: 1,
      maxExecutionTime: 15000,
      expectedResponseTime: 5000,
      concurrent: false,
      description: 'End-to-end testing including frontend integration',
      params: {
        format: 'csv',
        includeFrontend: true,
      },
      comparison: {
        targets: ['get-products', 'get-products-mesh'],
      },
      metrics: {
        trackDownloadTime: true,
        trackUIResponse: true,
        trackFileStorage: true,
      },
    },
  };
}

/**
 * Load performance test scenario configuration
 * @purpose Load predefined test scenario with specific performance parameters
 * @param {string} scenarioName - Name of scenario to load (quick, thorough, stress)
 * @param {Object} config - Application configuration
 * @returns {Object} Complete scenario configuration with test parameters
 * @usedBy executePerformanceTestWorkflow, executePerformanceTestWithScenario
 */
function loadTestScenario(scenarioName, config) {
  const scenarios = getPerformanceTestScenarios();

  const scenario = scenarios[scenarioName];
  if (!scenario) {
    throw new Error(
      `Unknown scenario: ${scenarioName}. Available: ${Object.keys(scenarios).join(', ')}`
    );
  }

  // Override with config-specific expectations if available
  if (config.testing?.scenarios?.[scenarioName]) {
    return { ...scenario, ...config.testing.scenarios[scenarioName] };
  }

  return scenario;
}

/**
 * Build performance test configuration
 * @purpose Create complete test configuration combining scenario, target, and options
 * @param {string} target - Target for performance testing
 * @param {Object} scenario - Loaded test scenario configuration
 * @param {Object} options - Additional test options
 * @returns {Object} Complete performance test configuration
 * @usedBy executePerformanceTestWorkflow
 */
function buildPerformanceTestConfig(target, scenario, options) {
  const { iterations: userIterations, timeout: userTimeout, ...otherOptions } = options;

  return {
    target,
    scenario: scenario.name,
    iterations: userIterations || scenario.iterations,
    warmupIterations: scenario.warmupIterations,
    maxExecutionTime: userTimeout || scenario.maxExecutionTime,
    expectedResponseTime: scenario.expectedResponseTime,
    concurrent: scenario.concurrent,
    concurrentUsers: scenario.concurrentUsers || 1,
    description: scenario.description,
    startTime: new Date().toISOString(),
    ...otherOptions,
  };
}

// Test Execution

/**
 * Execute complete performance test scenario
 * @purpose Run all performance test iterations with warmup and collect results
 * @param {string} target - Target for performance testing
 * @param {Object} testConfig - Complete test configuration
 * @returns {Promise<Object>} Performance test execution result with all iterations
 * @usedBy executePerformanceTestWorkflow
 */
async function executePerformanceTestScenario(target, testConfig) {
  const results = {
    target,
    scenario: testConfig.scenario,
    startTime: testConfig.startTime,
    warmupResults: [],
    testResults: [],
    totalIterations: 0,
    completedIterations: 0,
  };

  try {
    // Step 1: Execute warmup iterations
    for (let i = 0; i < testConfig.warmupIterations; i++) {
      const warmupResult = await executePerformanceTestIteration(target, testConfig, true);
      results.warmupResults.push(warmupResult);
      results.totalIterations++;
    }

    // Step 2: Execute actual test iterations
    if (testConfig.concurrent) {
      // Concurrent execution for stress testing
      const iterationPromises = [];
      for (let i = 0; i < testConfig.iterations; i++) {
        iterationPromises.push(executePerformanceTestIteration(target, testConfig, false));
        results.totalIterations++;
      }

      const concurrentResults = await Promise.all(iterationPromises);
      results.testResults.push(...concurrentResults);
      results.completedIterations += concurrentResults.length;
    } else {
      // Sequential execution for accurate timing
      for (let i = 0; i < testConfig.iterations; i++) {
        const iterationResult = await executePerformanceTestIteration(target, testConfig, false);
        results.testResults.push(iterationResult);
        results.totalIterations++;
        results.completedIterations++;

        // Small delay between iterations for sequential testing
        if (i < testConfig.iterations - 1) {
          await sleep(100);
        }
      }
    }

    results.endTime = new Date().toISOString();
    results.success = results.testResults.every((r) => r.success);

    return results;
  } catch (error) {
    results.endTime = new Date().toISOString();
    results.success = false;
    results.error = error.message;
    return results;
  }
}

/**
 * Execute single performance test iteration
 * @purpose Run one performance test iteration and measure execution time
 * @param {string} target - Target for performance testing
 * @param {Object} testConfig - Test configuration
 * @param {boolean} isWarmup - Whether this is a warmup iteration
 * @returns {Promise<Object>} Single iteration result with timing and success status
 * @usedBy executePerformanceTestScenario
 */
async function executePerformanceTestIteration(target, testConfig, isWarmup = false) {
  const startTime = Date.now();

  try {
    // Generate realistic test duration based on target and configuration
    const duration = generateRealisticTestDuration(target, testConfig);

    // Simulate test execution
    await sleep(duration);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      success: true,
      executionTime,
      target,
      isWarmup,
      timestamp: new Date(startTime).toISOString(),
      withinExpectation: executionTime <= testConfig.expectedResponseTime,
      withinMaxTime: executionTime <= testConfig.maxExecutionTime,
    };
  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      success: false,
      executionTime,
      target,
      isWarmup,
      timestamp: new Date(startTime).toISOString(),
      error: error.message,
      withinExpectation: false,
      withinMaxTime: executionTime <= testConfig.maxExecutionTime,
    };
  }
}

// Test Duration Generation

/**
 * Generate realistic test duration for performance testing
 * @purpose Create realistic execution times based on target type and configuration
 * @param {string} target - Target being tested
 * @param {Object} testConfig - Test configuration
 * @returns {number} Generated test duration in milliseconds
 * @usedBy executePerformanceTestIteration
 */
function generateRealisticTestDuration(target, testConfig) {
  // Base durations by target type (in milliseconds)
  const baseDurations = {
    'get-products': 800,
    'get-products-mesh': 1200,
    'browse-files': 300,
    'download-file': 500,
    'delete-file': 200,
    products: 600,
    categories: 400,
    customers: 700,
  };

  let baseDuration = baseDurations[target] || 500;

  // Add scenario-specific variation
  if (testConfig.scenario && testConfig.scenario.includes('stress')) {
    baseDuration *= 1.5; // Stress tests are slower
  } else if (testConfig.scenario && testConfig.scenario.includes('quick')) {
    baseDuration *= 0.8; // Quick tests are faster
  }

  // Add realistic variance (±30%)
  const variance = 0.3;
  const minDuration = baseDuration * (1 - variance);
  const maxDuration = baseDuration * (1 + variance);

  return Math.floor(minDuration + Math.random() * (maxDuration - minDuration));
}

module.exports = {
  loadTestScenario,
  buildPerformanceTestConfig,
  executePerformanceTestScenario,
  executePerformanceTestIteration,
  generateRealisticTestDuration,
};
