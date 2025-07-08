/**
 * Baseline manager for performance testing
 * Provides unified interface for all baseline operations
 * @module core/testing/performance/baseline-manager
 */

const path = require('path');

const ora = require('ora');

const {
  loadBaselines,
  saveBaseline,
  checkBaseline,
  validateBaselineData,
} = require('./operations/baseline-operations');
const {
  createComparisonHelpers,
  defineMetricComparisons,
  executeComparisons,
  calculateOverallVerdict,
} = require('./operations/comparison-logic');

/**
 * Get baseline configuration from provided config object
 * @param {Object} config - Configuration object
 * @returns {Object} Baseline configuration
 */
function getBaselineConfig(config) {
  return {
    baseline: {
      maxAgeDays: config.testing?.performance?.baseline?.maxAgeDays || 30,
    },
    thresholds: {
      executionTime: config.testing?.performance?.thresholds?.executionTime || 5000,
      memory: config.testing?.performance?.thresholds?.memory || 100,
      products: config.testing?.performance?.thresholds?.products || 1000,
      categories: config.testing?.performance?.thresholds?.categories || 100,
      compression: config.testing?.performance?.thresholds?.compression || 50,
      responseTime: {
        p95: config.testing?.performance?.thresholds?.responseTime?.p95 || 2000,
        p99: config.testing?.performance?.thresholds?.responseTime?.p99 || 5000,
      },
      errorRate: config.testing?.performance?.thresholds?.errorRate || 0.05,
    },
  };
}

/**
 * Compares current metrics with baseline
 * @param {string} scenarioName - Scenario name
 * @param {Object} currentMetrics - Current performance metrics
 * @param {string} environment - Environment name
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 * @returns {Object|undefined} Comparison result
 */
function compareWithBaseline(scenarioName, currentMetrics, environment, baselineConfig, spinner) {
  const baselines = loadBaselines(baselineConfig, spinner);
  const baseline = validateBaselineData(baselines, scenarioName, environment, spinner);

  if (!baseline) {
    return;
  }

  const helpers = createComparisonHelpers();
  const comparisons = defineMetricComparisons(currentMetrics, baseline, baselineConfig);
  const verdicts = executeComparisons(comparisons, helpers, spinner);

  return calculateOverallVerdict(verdicts, comparisons, spinner);
}

/**
 * Creates a baseline manager for performance metrics
 * @param {Object} config - Configuration object
 * @param {Object} options - Configuration options
 * @returns {Object} Baseline manager methods
 */
function createBaselineManager(config, options = {}) {
  const configData = getBaselineConfig(config);

  const baselineConfig = {
    baselineFile: options.baselineFile || path.join(process.cwd(), 'config/baseline-metrics.json'),
    maxAgeDays: options.maxAgeDays || configData.baseline.maxAgeDays,
    thresholds: {
      executionTime: configData.thresholds.executionTime,
      memory: configData.thresholds.memory,
      products: configData.thresholds.products,
      categories: configData.thresholds.categories,
      compression: configData.thresholds.compression,
      responseTime: {
        p95: configData.thresholds.responseTime.p95,
        p99: configData.thresholds.responseTime.p99,
      },
      errorRate: configData.thresholds.errorRate,
      ...options.thresholds,
    },
  };

  const spinner = ora();

  return {
    checkBaseline: (scenarioName, environment) =>
      checkBaseline(scenarioName, environment, baselineConfig, spinner),
    saveBaseline: (scenarioName, metrics, environment) =>
      saveBaseline(scenarioName, metrics, environment, baselineConfig, spinner),
    compareWithBaseline: (scenarioName, currentMetrics, environment) =>
      compareWithBaseline(scenarioName, currentMetrics, environment, baselineConfig, spinner),
    getThresholds: () => baselineConfig.thresholds,
    loadBaselines: () => loadBaselines(baselineConfig, spinner),
    config: baselineConfig,
  };
}

module.exports = createBaselineManager;
