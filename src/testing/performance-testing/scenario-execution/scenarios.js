/**
 * Scenario Execution - Scenarios Sub-module
 * All performance test scenario definitions and configuration utilities
 */

// Workflows

/**
 * Get all available performance test scenarios
 * @purpose Define all predefined performance test scenarios with their configurations
 * @returns {Object} Object containing all available scenarios keyed by name
 * @usedBy loadTestScenario
 */
function getPerformanceTestScenarios() {
  return {
    // Basic Performance Scenarios
    quick: buildQuickScenario(),
    thorough: buildThoroughScenario(),
    stress: buildStressScenario(),
    baseline: buildBaselineScenario(),
    endurance: buildEnduranceScenario(),
    spike: buildSpikeScenario(),
    volume: buildVolumeScenario(),
    concurrent: buildConcurrentScenario(),
  };
}

/**
 * Load specific test scenario configuration
 * @purpose Retrieve and validate scenario configuration by name
 * @param {string} scenarioName - Name of scenario to load
 * @returns {Object} Scenario configuration object
 * @usedBy executePerformanceTestScenario
 */
function loadTestScenario(scenarioName) {
  const scenarios = getPerformanceTestScenarios();
  const scenario = scenarios[scenarioName];

  if (!scenario) {
    throw new Error(`Unknown performance test scenario: ${scenarioName}`);
  }

  return {
    ...scenario,
    scenarioName,
    loadedAt: new Date().toISOString(),
  };
}

// Utilities

/**
 * Build quick scenario configuration
 * @purpose Create quick performance test scenario for fast validation
 * @returns {Object} Quick scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildQuickScenario() {
  return {
    name: 'Quick Performance Test',
    iterations: 3,
    warmupIterations: 1,
    maxExecutionTime: 5000,
    expectedResponseTime: 2000,
    concurrent: false,
    description: 'Fast performance validation with minimal load',
  };
}

/**
 * Build thorough scenario configuration
 * @purpose Create thorough performance test scenario for comprehensive analysis
 * @returns {Object} Thorough scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildThoroughScenario() {
  return {
    name: 'Thorough Performance Test',
    iterations: 10,
    warmupIterations: 2,
    maxExecutionTime: 10000,
    expectedResponseTime: 3000,
    concurrent: false,
    description: 'Comprehensive performance analysis with detailed metrics',
  };
}

/**
 * Build stress scenario configuration
 * @purpose Create stress test scenario for high-load testing
 * @returns {Object} Stress scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildStressScenario() {
  return {
    name: 'Stress Performance Test',
    iterations: 20,
    warmupIterations: 3,
    maxExecutionTime: 15000,
    expectedResponseTime: 5000,
    concurrent: true,
    concurrentUsers: 5,
    description: 'High-load performance testing with concurrent execution',
  };
}

/**
 * Build baseline scenario configuration
 * @purpose Create baseline scenario for establishing performance baselines
 * @returns {Object} Baseline scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildBaselineScenario() {
  return {
    name: 'Baseline Performance Test',
    iterations: 5,
    warmupIterations: 1,
    maxExecutionTime: 8000,
    expectedResponseTime: 2500,
    concurrent: false,
    description: 'Baseline performance measurement for comparison',
  };
}

/**
 * Build endurance scenario configuration
 * @purpose Create endurance test scenario for sustained load testing
 * @returns {Object} Endurance scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildEnduranceScenario() {
  return {
    name: 'Endurance Performance Test',
    iterations: 50,
    warmupIterations: 5,
    maxExecutionTime: 30000,
    expectedResponseTime: 4000,
    concurrent: false,
    description: 'Extended performance testing for stability validation',
  };
}

/**
 * Build spike scenario configuration
 * @purpose Create spike test scenario for sudden load increases
 * @returns {Object} Spike scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildSpikeScenario() {
  return {
    name: 'Spike Performance Test',
    iterations: 15,
    warmupIterations: 2,
    maxExecutionTime: 12000,
    expectedResponseTime: 6000,
    concurrent: true,
    concurrentUsers: 10,
    spikePattern: true,
    description: 'Sudden load spike testing for resilience validation',
  };
}

/**
 * Build volume scenario configuration
 * @purpose Create volume test scenario for large data processing
 * @returns {Object} Volume scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildVolumeScenario() {
  return {
    name: 'Volume Performance Test',
    iterations: 8,
    warmupIterations: 2,
    maxExecutionTime: 20000,
    expectedResponseTime: 8000,
    concurrent: false,
    dataVolume: 'large',
    description: 'Large data volume processing performance testing',
  };
}

/**
 * Build concurrent scenario configuration
 * @purpose Create concurrent test scenario for multi-user simulation
 * @returns {Object} Concurrent scenario configuration
 * @usedBy getPerformanceTestScenarios
 */
function buildConcurrentScenario() {
  return {
    name: 'Concurrent Performance Test',
    iterations: 12,
    warmupIterations: 2,
    maxExecutionTime: 10000,
    expectedResponseTime: 4000,
    concurrent: true,
    concurrentUsers: 8,
    description: 'Multi-user concurrent performance testing',
  };
}

/**
 * Get available scenario names
 * @purpose List all available performance test scenario names
 * @returns {Array} Array of scenario names
 * @usedBy Performance test configuration utilities
 */
function getAvailableScenarios() {
  return Object.keys(getPerformanceTestScenarios());
}

module.exports = {
  // Workflows
  getPerformanceTestScenarios,
  loadTestScenario,

  // Utilities
  buildQuickScenario,
  buildThoroughScenario,
  buildStressScenario,
  buildBaselineScenario,
  buildEnduranceScenario,
  buildSpikeScenario,
  buildVolumeScenario,
  buildConcurrentScenario,
  getAvailableScenarios,
};
