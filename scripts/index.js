/**
 * Scripts Domain Catalog
 *
 * Following Domain-Driven Design (DDD) principles with separation between
 * shared infrastructure domains and business domains.
 *
 * Architecture:
 * scripts/
 * ├── core/         # Shared infrastructure (environment, hash, script framework)
 * │   ├── operations/   # Shared operations (environment, spinner, hash)
 * │   └── utils/        # Shared utilities (string, file)
 * ├── format/       # Shared infrastructure (formatting, display, messaging)
 * │   ├── workflows/    # Complex formatting scenarios
 * │   ├── operations/   # Formatting operations and templates
 * │   └── utils/        # Basic formatters and constants
 * ├── build/        # Business domain (build processes)
 * │   ├── workflows/    # High-level build orchestration
 * │   └── operations/   # Mid-level build processes
 * ├── deploy/       # Business domain (deployment processes)
 * │   ├── workflows/    # High-level deployment orchestration
 * │   └── operations/   # Mid-level deployment processes
 * └── test/         # Business domain (testing processes)
 *     ├── workflows/    # High-level test orchestration
 *     └── operations/   # Mid-level test processes
 *
 * Shared infrastructure domains (core, format) provide reusable utilities
 * that eliminate duplication across business domains (build, deploy, test).
 */

module.exports = {
  // Shared infrastructure domains
  core: require('./core'),
  format: require('./format'),

  // Shared operations for backwards compatibility
  operations: {
    environment: require('./core/operations/environment'),
    spinner: require('./core/operations/spinner'),
    hash: require('./core/operations/hash'),
    sleep: require('./core/utils').sleep,
    mesh: require('./core/operations/mesh'),
  },

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
    },
    operations: require('./test/operations'),
  },
};
