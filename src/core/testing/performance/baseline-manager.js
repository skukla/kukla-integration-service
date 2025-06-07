const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const ora = require('ora');

const { createLazyConfigGetter } = require('../../config/lazy-loader');

/**
 * Lazy configuration getter for baseline manager
 * @type {Function}
 */
const getBaselineConfig = createLazyConfigGetter('baseline-manager-config', (config) => ({
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
}));

/**
 * Creates a baseline manager for performance metrics
 * @param {Object} options Configuration options
 * @param {Object} [params] Action parameters for configuration
 * @returns {Object} Baseline manager methods
 */
function createBaselineManager(options = {}, params = {}) {
  // Load configuration using lazy getter
  const config = getBaselineConfig(params);

  const baselineConfig = {
    baselineFile: options.baselineFile || path.join(process.cwd(), 'config/baseline-metrics.json'),
    maxAgeDays: options.maxAgeDays || config.baseline.maxAgeDays,
    thresholds: {
      executionTime: config.thresholds.executionTime,
      memory: config.thresholds.memory,
      products: config.thresholds.products,
      categories: config.thresholds.categories,
      compression: config.thresholds.compression,
      responseTime: {
        p95: config.thresholds.responseTime.p95,
        p99: config.thresholds.responseTime.p99,
      },
      errorRate: config.thresholds.errorRate,
      ...options.thresholds,
    },
  };

  const spinner = ora();

  function loadBaselines() {
    try {
      if (fs.existsSync(baselineConfig.baselineFile)) {
        return JSON.parse(fs.readFileSync(baselineConfig.baselineFile, 'utf8'));
      }
    } catch (error) {
      spinner.warn('No baseline metrics found or error loading baseline');
    }
    return null;
  }

  function saveBaseline(scenarioName, metrics, environment) {
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

  function checkBaseline(scenarioName, environment) {
    const baselines = loadBaselines();
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

  function compareWithBaseline(scenarioName, currentMetrics, environment) {
    const baselines = loadBaselines();
    if (!baselines || !baselines[environment] || !baselines[environment][scenarioName]) {
      spinner.warn(`No baseline available for comparison in ${environment} environment`);
      return;
    }

    const baseline = baselines[environment][scenarioName].metrics;
    const verdicts = [];

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

    // Compare metrics
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

    // Print comparisons
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

    // Overall verdict
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

  return {
    checkBaseline,
    saveBaseline,
    compareWithBaseline,
    getThresholds: () => baselineConfig.thresholds,
    loadBaselines,
    config: baselineConfig,
  };
}

module.exports = createBaselineManager;
