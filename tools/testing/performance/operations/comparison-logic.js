/**
 * Comparison logic for performance testing
 * Contains metric comparison and analysis functionality
 * @module core/testing/performance/operations/comparison-logic
 */

const chalk = require('chalk');

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
 * Creates basic performance metric comparisons
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baseline - Baseline metrics
 * @param {Object} baselineConfig - Baseline configuration
 * @returns {Array} Array of basic comparison configurations
 */
function createBasicComparisons(currentMetrics, baseline, baselineConfig) {
  return [
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
  ];
}

/**
 * Creates response time metric comparisons
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baseline - Baseline metrics
 * @param {Object} baselineConfig - Baseline configuration
 * @returns {Array} Array of response time comparison configurations
 */
function createResponseTimeComparisons(currentMetrics, baseline, baselineConfig) {
  return [
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
}

/**
 * Creates optional compression metric comparison
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baseline - Baseline metrics
 * @param {Object} baselineConfig - Baseline configuration
 * @returns {Array} Array of compression comparison configurations (empty if not applicable)
 */
function createCompressionComparisons(currentMetrics, baseline, baselineConfig) {
  if (baseline.compression !== null && currentMetrics.compression !== null) {
    return [
      {
        name: 'Compression',
        current: currentMetrics.compression,
        baseline: baseline.compression,
        unit: '%',
        threshold: baselineConfig.thresholds.compression,
      },
    ];
  }
  return [];
}

/**
 * Defines the metric comparison configuration
 * @param {Object} currentMetrics - Current performance metrics
 * @param {Object} baseline - Baseline metrics
 * @param {Object} baselineConfig - Baseline configuration
 * @returns {Array} Array of comparison configurations
 */
function defineMetricComparisons(currentMetrics, baseline, baselineConfig) {
  const basicComparisons = createBasicComparisons(currentMetrics, baseline, baselineConfig);
  const responseTimeComparisons = createResponseTimeComparisons(
    currentMetrics,
    baseline,
    baselineConfig
  );
  const compressionComparisons = createCompressionComparisons(
    currentMetrics,
    baseline,
    baselineConfig
  );

  return [...basicComparisons, ...responseTimeComparisons, ...compressionComparisons];
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

module.exports = {
  createComparisonHelpers,
  defineMetricComparisons,
  executeComparisons,
  calculateOverallVerdict,
};
