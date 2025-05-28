const fs = require('fs');
const path = require('path');
const { default: ora } = require('ora');
const chalk = require('chalk').default;
const { loadConfig } = require('../../../config');

function createBaselineManager(options = {}) {
    const config = loadConfig().performance;
    const baselineConfig = {
        baselineFile: options.baselineFile || path.join(__dirname, 'metrics.json'),
        maxAgeDays: options.maxAgeDays || config.baseline.maxAgeDays,
        thresholds: {
            executionTime: config.thresholds.executionTime,
            memory: config.thresholds.memory,
            products: config.thresholds.products,
            categories: config.thresholds.categories,
            compression: config.thresholds.compression,
            ...options.thresholds
        }
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
                metrics
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
            spinner.warn(`Baseline for "${scenarioName}" in ${environment} environment is ${daysOld.toFixed(1)} days old`);
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
            { name: 'Execution time', current: currentMetrics.executionTime, baseline: baseline.executionTime, unit: 's', scale: 1000, threshold: baselineConfig.thresholds.executionTime },
            { name: 'Memory used', current: currentMetrics.memory, baseline: baseline.memory, unit: 'MB', scale: 1024 * 1024, threshold: baselineConfig.thresholds.memory },
            { name: 'Products', current: currentMetrics.products, baseline: baseline.products, threshold: baselineConfig.thresholds.products },
            { name: 'Categories', current: currentMetrics.categories, baseline: baseline.categories, threshold: baselineConfig.thresholds.categories }
        ];

        if (baseline.compression !== null && currentMetrics.compression !== null) {
            comparisons.push({ name: 'Compression', current: currentMetrics.compression, baseline: baseline.compression, unit: '%', threshold: baselineConfig.thresholds.compression });
        }

        // Print comparisons
        spinner.info('📊 Performance Comparison:');
        comparisons.forEach(comp => {
            const status = getStatus(comp.current, comp.baseline, comp.threshold);
            verdicts.push(status.icon);
            const value = comp.scale ? 
                diff(comp.current / comp.scale, comp.baseline / comp.scale, comp.unit) :
                diff(comp.current, comp.baseline, comp.unit);
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

        spinner.info(overallColor(`Overall: ${overall} Performance is ${
            overall === '✅' ? 'within acceptable limits.' :
            overall === '⚠️' ? 'showing some warnings.' :
            'degraded!'
        }`));
    }

    return {
        checkBaseline,
        saveBaseline,
        compareWithBaseline
    };
}

module.exports = createBaselineManager; 