/**
 * Core domain main entry point
 * Provides unified interface for all core functionality
 * @module core
 */

// CLI utilities
const cliArgs = require('./cli/args');
// Performance testing framework
const performanceTesting = require('./testing/performance');

// Organized exports by domain area
module.exports = {
  // CLI functionality
  cli: cliArgs,

  // Performance testing functionality
  testing: {
    performance: performanceTesting,
  },

  // Direct access to commonly used functions
  parseArgs: cliArgs.parseArgs,
  testScenario: performanceTesting.testScenario,
  createPerformanceTester: performanceTesting.createPerformanceTester,
};
