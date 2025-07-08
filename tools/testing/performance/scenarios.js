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
      maxExecutionTime: 5000, // Allow reasonable time for REST API
      maxMemory: 50000000, // 50MB in bytes
    },
  },

  // API Mesh Scenarios
  'mesh-baseline': {
    name: 'API Mesh Baseline',
    action: 'get-products-mesh',
    description: 'Baseline performance test for optimized API Mesh implementation',
    params: {
      format: 'csv',
    },
    expectedMetrics: {
      maxExecutionTime: 5000, // Allow reasonable time for mesh
      maxMemory: 50000000, // 50MB in bytes (reasonable for mesh processing)
    },
  },

  // Comparative Scenarios
  'rest-vs-mesh': {
    name: 'REST API vs API Mesh Comparison',
    actions: ['get-products', 'get-products-mesh'],
    description: 'Performance comparison: should be within 10% of each other',
    params: {
      format: 'csv',
    },
    comparison: {
      tolerancePercent: 10, // Mesh should now be competitive with REST
      mustHaveSameOutput: true,
      trackApiCalls: true,
    },
  },

  // Detailed Analysis Scenarios
  'mesh-analysis': {
    name: 'API Mesh Detailed Analysis',
    action: 'get-products-mesh',
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
    description: 'Test different page sizes for optimal performance',
    variants: [
      { params: { pageSize: 100 }, name: 'Small Batches', expectedTime: 3500 },
      { params: { pageSize: 150 }, name: 'Optimal Batches', expectedTime: 2500 },
      { params: { pageSize: 200 }, name: 'Large Batches', expectedTime: 3000 },
      { params: { pageSize: 300 }, name: 'Extra Large Batches', expectedTime: 4000 },
    ],
    findOptimal: true,
  },

  // Regression Testing
  'mesh-regression': {
    name: 'API Mesh Performance Regression',
    action: 'get-products-mesh',
    description: 'Detect performance regressions in mesh implementation',
    params: {
      format: 'csv',
    },
    regression: {
      maxSlowdownPercent: 15, // Alert if >15% slower than baseline
      requireImprovement: false,
      trackTrends: true,
    },
  },

  // Infrastructure Scenarios
  'full-stack': {
    name: 'Full Stack Performance',
    actions: ['get-products', 'get-products-mesh'],
    description: 'End-to-end testing including frontend integration',
    params: {
      format: 'csv',
      includeFrontend: true,
    },
    metrics: {
      trackDownloadTime: true,
      trackUIResponse: true,
      trackFileStorage: true,
    },
  },
};

module.exports = scenarios;
