const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const ora = require('ora');

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
 * Loads baseline metrics from file
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 * @returns {Object|null} Baseline data or null
 */
function loadBaselines(baselineConfig, spinner) {
  try {
    if (fs.existsSync(baselineConfig.baselineFile)) {
      return JSON.parse(fs.readFileSync(baselineConfig.baselineFile, 'utf8'));
    }
  } catch (error) {
    spinner.warn('No baseline metrics found or error loading baseline');
  }
  return null;
}

/**
 * Saves baseline metrics to file
 * @param {string} scenarioName - Scenario name
 * @param {Object} metrics - Performance metrics
 * @param {string} environment - Environment name
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 */
function saveBaseline(scenarioName, metrics, environment, baselineConfig, spinner) {
  try {
    let baselines = {};
    if (fs.existsSync(baselineConfig.baselineFile)) {
      baselines = JSON.parse(fs.readFileSync(baselineConfig.baselineFile, 'utf8'));
    }
    if (!baselines[environment]) {
      baselines[environment] = {};
    }
    baselines[environment][scenarioName] = {
      timestamp: new Date().toISOString(),
      metrics,
    };
    fs.writeFileSync(baselineConfig.baselineFile, JSON.stringify(baselines, null, 2));
    spinner.succeed(`Baseline metrics saved for ${scenarioName} in ${environment} environment`);
  } catch (error) {
    spinner.fail('Error saving baseline metrics');
  }
}

/**
 * Checks if baseline exists and is valid
 * @param {string} scenarioName - Scenario name
 * @param {string} environment - Environment name
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 * @returns {Object} Baseline check result
 */
function checkBaseline(scenarioName, environment, baselineConfig, spinner) {
  const baselines = loadBaselines(baselineConfig, spinner);
  if (!baselines || !baselines[environment] || !baselines[environment][scenarioName]) {
    spinner.warn(`No baseline found for "${scenarioName}" in ${environment} environment`);
    return { needsBaseline: true };
  }

  const baseline = baselines[environment][scenarioName];
  const baselineDate = new Date(baseline.timestamp);
  const now = new Date();
  const daysOld = (now - baselineDate) / (1000 * 60 * 60 * 24);

  if (daysOld > baselineConfig.maxAgeDays) {
    spinner.warn(
      `Baseline for "${scenarioName}" in ${environment} environment is ${daysOld.toFixed(1)} days old`
    );
    return { needsBaseline: true };
  }

  spinner.succeed(`Valid baseline found for "${scenarioName}" in ${environment} environment`);
  return { needsBaseline: false, baseline: baseline.metrics };
}

/**
 * Validates and loads baseline data for comparison
 * @param {Object} baselines - All baseline data
 * @param {string} scenarioName - Scenario name
 * @param {string} environment - Environment name
 * @param {Object} spinner - Spinner instance
 * @returns {Object|null} Baseline metrics or null if not found
 */
function validateBaselineData(baselines, scenarioName, environment, spinner) {
  if (!baselines || !baselines[environment] || !baselines[environment][scenarioName]) {
    spinner.warn(`No baseline available for comparison in ${environment} environment`);
    return null;
  }
  return baselines[environment][scenarioName].metrics;
}

/**
 * Creates helper functions for metric comparison
 * @returns {Object} Helper functions for diff and status calculation
 */
function createComparisonHelpers() {
  function diff(val, base, unit = '', decimals = 2) {
    if (val === undefined || val === null || base === undefined || base === null) {
      return `N/A${unit}`;
    }
    const d = val - base;
    const sign = d > 0 ? '+' : d < 0 ? '-' : '';
    return `${val.toFixed(decimals)}${unit} (${sign}${Math.abs(d).toFixed(decimals)}${unit})`;
  }

  function getStatus(val, base, threshold) {
    const percentDiff = (val - base) / base;
    if (percentDiff <= threshold && percentDiff >= -threshold) {
      return { icon: '✅', color: chalk.green };
    } else if (Math.abs(percentDiff) <= threshold * 2) {
      return { icon: '⚠️', color: chalk.yellow };
    } else {
      return { icon: '❌', color: chalk.red };
    }
  }

  return { diff, getStatus };
}

/**
 * Defines the metric comparison configuration
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baseline - Baseline metrics
 * @param {Object} baselineConfig - Baseline configuration
 * @returns {Array} Array of comparison configurations
 */
function defineMetricComparisons(currentMetrics, baseline, baselineConfig) {
  const comparisons = [
    {
      name: 'Execution time',
      current: currentMetrics.executionTime,
      baseline: baseline.executionTime,
      unit: 's',
      scale: 1000,
      threshold: baselineConfig.thresholds.executionTime,
    },
    {
      name: 'Memory used',
      current: currentMetrics.memory,
      baseline: baseline.memory,
      unit: 'MB',
      scale: 1024 * 1024,
      threshold: baselineConfig.thresholds.memory,
    },
    {
      name: 'Products',
      current: currentMetrics.products,
      baseline: baseline.products,
      threshold: baselineConfig.thresholds.products,
    },
    {
      name: 'Categories',
      current: currentMetrics.categories,
      baseline: baseline.categories,
      threshold: baselineConfig.thresholds.categories,
    },
    {
      name: 'Response p95',
      current: currentMetrics.responseTime?.p95,
      baseline: baseline.responseTime?.p95,
      unit: 'ms',
      threshold: baselineConfig.thresholds.responseTime.p95,
    },
    {
      name: 'Response p99',
      current: currentMetrics.responseTime?.p99,
      baseline: baseline.responseTime?.p99,
      unit: 'ms',
      threshold: baselineConfig.thresholds.responseTime.p99,
    },
    {
      name: 'Error rate',
      current: currentMetrics.errorRate,
      baseline: baseline.errorRate,
      unit: '%',
      threshold: baselineConfig.thresholds.errorRate,
    },
  ];

  if (baseline.compression !== null && currentMetrics.compression !== null) {
    comparisons.push({
      name: 'Compression',
      current: currentMetrics.compression,
      baseline: baseline.compression,
      unit: '%',
      threshold: baselineConfig.thresholds.compression,
    });
  }

  return comparisons;
}

/**
 * Executes metric comparisons and displays results
 * @param {Array} comparisons - Comparison configurations
 * @param {Object} helpers - Helper functions (diff, getStatus)
 * @param {Object} spinner - Spinner instance
 * @returns {Array} Array of verdict icons
 */
function executeComparisons(comparisons, helpers, spinner) {
  const { diff, getStatus } = helpers;
  const verdicts = [];

  spinner.info('📊 Performance Comparison:');
  comparisons.forEach((comp) => {
    if (comp.current === undefined || comp.baseline === undefined) {
      return;
    }
    const status = getStatus(comp.current, comp.baseline, comp.threshold);
    verdicts.push(status.icon);
    const value = comp.scale
      ? diff(comp.current / comp.scale, comp.baseline / comp.scale, comp.unit)
      : diff(comp.current, comp.baseline, comp.unit);
    spinner.info(status.color(`${comp.name.padEnd(15)} ${value} ${status.icon}`));
  });

  return verdicts;
}

/**
 * Calculates and displays overall performance verdict
 * @param {Array} verdicts - Array of individual verdict icons
 * @param {Array} comparisons - Comparison configurations
 * @param {Object} spinner - Spinner instance
 * @returns {Object} Overall verdict result
 */
function calculateOverallVerdict(verdicts, comparisons, spinner) {
  let overall = '✅';
  let overallColor = chalk.green;
  if (verdicts.includes('❌')) {
    overall = '❌';
    overallColor = chalk.red;
  } else if (verdicts.includes('⚠️')) {
    overall = '⚠️';
    overallColor = chalk.yellow;
  }

  spinner.info(
    overallColor(
      `Overall: ${overall} Performance is ${
        overall === '✅'
          ? 'within acceptable limits.'
          : overall === '⚠️'
            ? 'showing some warnings.'
            : 'degraded!'
      }`
    )
  );

  return {
    verdicts,
    overall,
    comparisons,
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
