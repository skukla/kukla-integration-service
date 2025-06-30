/**
 * Performance test scenarios for REST API and Mesh comparison
 * @module core/testing/performance/scenarios
 */

const scenarios = {
  // REST API Scenarios
  'rest-api-baseline': {
    name: 'REST API Baseline',
    action: 'get-products',
    description: 'Baseline performance test for REST API implementation',
    params: {
      format: 'csv',
    },
    expectedMetrics: {
      maxExecutionTime: 15000,
      maxMemoryUsage: 256,
      minProductCount: 100,
    },
  },

  // API Mesh Scenarios
  'mesh-baseline': {
    name: 'API Mesh Baseline',
    action: 'get-products-mesh',
    description: 'Baseline performance test for API Mesh implementation',
    params: {
      format: 'csv',
    },
    expectedMetrics: {
      maxExecutionTime: 20000, // Allow slightly more time for mesh
      maxMemoryUsage: 256,
      minProductCount: 100,
    },
  },

  // Comparative Scenarios
  'rest-vs-mesh': {
    name: 'REST API vs API Mesh Comparison',
    actions: ['get-products', 'get-products-mesh'],
    description: 'Direct performance comparison between REST API and API Mesh',
    params: {
      format: 'csv',
    },
    comparison: {
      tolerancePercent: 20, // Mesh can be 20% slower than REST
      mustHaveSameOutput: true,
    },
  },

  // Load Testing Scenarios
  'mesh-concurrent': {
    name: 'API Mesh Concurrent Load',
    action: 'get-products-mesh',
    description: 'Test API Mesh under concurrent load',
    params: {
      format: 'csv',
    },
    concurrency: {
      users: 3,
      duration: 30, // seconds
    },
  },

  // Optimization Scenarios
  'mesh-batching': {
    name: 'API Mesh Batch Size Optimization',
    action: 'get-products-mesh',
    description: 'Test different batch sizes for optimal performance',
    variants: [
      { params: { pageSize: 50 }, name: 'Small Batches' },
      { params: { pageSize: 100 }, name: 'Medium Batches' },
      { params: { pageSize: 200 }, name: 'Large Batches' },
    ],
  },
};

module.exports = scenarios;
