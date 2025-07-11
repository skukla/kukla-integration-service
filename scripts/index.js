/**
 * Scripts Domain Catalog
 *
 * Following Domain-Driven Design (DDD) principles with separation between
 * shared infrastructure domains and business domains.
 */

module.exports = {
  // Shared infrastructure domains
  core: require('./core'),
  format: require('./core/formatting'),

  // Business domain exports
  build: {
    workflows: {
      appBuild: require('./build/workflows/app-build'),
      meshGeneration: require('./build/workflows/mesh-generation'),
      frontendGeneration: require('./build/workflows/frontend-generation'),
    },
    operations: require('./build/operations'),
  },

  deploy: {
    workflows: {
      appDeployment: require('./deploy/workflows/app-deployment'),
      meshDeployment: require('./deploy/workflows/mesh-deployment'),
    },
    operations: require('./deploy/operations'),
  },

  test: {
    workflows: {
      actionTesting: require('./test/workflows/action-testing'),
      apiTesting: require('./test/workflows/api-testing'),
      performanceTesting: require('./test/workflows/performance-testing'),
      testOrchestration: require('./test/workflows/test-orchestration'),
    },
    operations: require('./test/operations'),
  },
};
